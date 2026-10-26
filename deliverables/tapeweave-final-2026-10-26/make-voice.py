import asyncio
import json
from pathlib import Path
import edge_tts

directory = Path(__file__).resolve().parent
scenes = json.loads((directory / 'scenes.json').read_text())

async def main():
    for scene in scenes:
        output = directory / (scene['id'] + '.mp3')
        if not output.exists():
            speech = edge_tts.Communicate(scene['voice'], 'en-US-GuyNeural', rate='+0%', proxy='http://127.0.0.1:7897')
            await speech.save(str(output))
        print('VOICE ' + scene['id'], flush=True)

asyncio.run(main())
