// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Experimental two-world host. No tokens, fees, prizes, or NFT ownership requirement.
/// Each player may open multiple independent sessions. Not an audited game or identity system.
contract TapeWeaveHost {
    address public immutable processor;
    bytes32 public immutable pulseHash;
    bytes32 public immutable alternatingHash;
    uint256 public sessionCount;
    struct World { uint8 latch; uint8 score; uint8 resource; }
    struct Session {
        address player;
        uint8 circuit;
        uint8 version;
        World training;
        World door;
    }
    mapping(uint256 => Session) public sessions;
    event Opened(uint256 indexed session, address indexed player, uint8 circuit);
    event Acted(uint256 indexed session, uint8 version, bool trigger,
        uint8 trainingRequest, uint8 doorRequest, uint8 doorEffect);

    constructor(address target, bytes32 pulse, bytes32 alternating) {
        require(target.code.length != 0 && pulse != bytes32(0) && alternating != bytes32(0), "config");
        processor = target;
        pulseHash = pulse;
        alternatingHash = alternating;
    }

    function open(uint8 circuit) external returns (uint256 id) {
        require(circuit == 1 || circuit == 2, "circuit");
        _checkNetlist(circuit);
        id = ++sessionCount;
        Session storage s = sessions[id];
        s.player = msg.sender;
        s.circuit = circuit;
        s.door.resource = 2;
        emit Opened(id, msg.sender, circuit);
    }

    /// Expected version is a nonce: duplicate/stale requests revert, never advance twice.
    /// Two worlds commit together. No external state-changing calls or arbitrary circuit IDs.
    function act(uint256 id, uint8 expectedVersion, bool trigger) external {
        Session storage s = sessions[id];
        require(s.player == msg.sender, "player");
        require(s.version == expectedVersion && s.version < 4, "version");
        _checkNetlist(s.circuit);
        uint8 recharge = s.version == 0 || s.version == 2 ? 1 : 0;
        uint8 input = (trigger ? 1 : 0) | (recharge << 1);
        (uint8 nextTraining, uint8 trainingRequest) = _step(s.circuit, s.training.latch, input);
        (uint8 nextDoor, uint8 doorRequest) = _step(s.circuit, s.door.latch, input);
        // Validate bounded, reviewed truth tables even if an upgrade keeps netlist unchanged.
        _checkTransition(s.circuit, s.training.latch, input, nextTraining, trainingRequest);
        _checkTransition(s.circuit, s.door.latch, input, nextDoor, doorRequest);
        uint8 effect = doorRequest == 1 && s.version % 2 == 1 && s.door.resource > 0 ? 1 : 0;
        s.training.latch = nextTraining;
        s.training.score += trainingRequest;
        s.training.resource += trainingRequest;
        s.door.latch = nextDoor;
        s.door.score += effect;
        s.door.resource -= effect;
        ++s.version;
        emit Acted(id, s.version, trigger, trainingRequest, doorRequest, effect);
    }

    function _checkNetlist(uint8 circuit) private view {
        // Fixed gas bound, then bounded returndata copy to avoid a return-data memory bomb.
        bytes memory data = _read(abi.encodeWithSelector(bytes4(0x3fc4be56), uint256(circuit)), 512);
        bytes memory netlist = abi.decode(data, (bytes));
        require(keccak256(netlist) == (circuit == 1 ? pulseHash : alternatingHash), "netlist");
    }

    function _step(uint8 circuit, uint8 old, uint8 input) private view returns (uint8, uint8) {
        bytes memory data = _read(abi.encodeWithSelector(bytes4(0xe8281a1a), uint256(circuit),
            abi.encodePacked(old), abi.encodePacked(input)), 192);
        require(data.length == 192, "step size");
        (bytes memory next, bytes memory output) = abi.decode(data, (bytes, bytes));
        require(next.length == 1 && output.length == 1 && uint8(next[0]) < 2 && uint8(output[0]) < 2, "step bits");
        return (uint8(next[0]), uint8(output[0]));
    }

    function _read(bytes memory callData, uint256 maxSize) private view returns (bytes memory result) {
        address target = processor;
        bool ok;
        uint256 size;
        assembly ("memory-safe") {
            ok := staticcall(3000000, target, add(callData, 32), mload(callData), 0, 0)
            size := returndatasize()
        }
        require(ok && size <= maxSize, "processor read");
        result = new bytes(size);
        assembly ("memory-safe") { returndatacopy(add(result, 32), 0, size) }
    }

    function _checkTransition(uint8 circuit, uint8 old, uint8 input, uint8 next, uint8 request) private pure {
        uint8 trigger = input & 1;
        uint8 recharge = (input >> 1) & 1;
        uint8 expectedNext = circuit == 1 ? recharge | (old & (1 - trigger)) : old ^ trigger;
        uint8 expectedRequest = circuit == 1 ? old & trigger : (1 - old) & trigger;
        require(next == expectedNext && request == expectedRequest, "transition");
    }
}
