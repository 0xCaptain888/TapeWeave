// Local attached-device check. No unlock, install, wallet interaction or device identifier output.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),adb=process.env.ADB??'adb',args=process.argv.slice(2);
if(args.length){console.error('usage: ADB=/absolute/platform-tools/adb node scripts/android-preflight.mjs');process.exit(2);}
try{
 const {stdout}=await exec(adb,['devices'],{timeout:12000,maxBuffer:16384});
 const entries=stdout.split(/\r?\n/).slice(1).map(s=>s.trim()).filter(Boolean).map(s=>s.split(/\s+/));
 const ready=entries.filter(x=>x[1]==='device'),unauthorized=entries.filter(x=>x[1]==='unauthorized').length;
 if(ready.length!==1){
  console.log(JSON.stringify({status:'ANDROID_DEVICE_NOT_READY',readyDevices:ready.length,unauthorizedDevices:unauthorized,
   next:unauthorized?'请在自己的手机确认USB调试授权，再重跑；不需要钱包私钥':
    ready.length>1?'只保留一台待验收设备，再重跑':'用数据线连接Android手机并启用USB调试，或直接在手机浏览器打开验收页',
   androidAcceptancePassed:false,deviceIdentifiersPrinted:false},null,2));
  process.exitCode=1;
 }else{
  const serial=ready[0][0];
  const read=async(...argv)=>(await exec(adb,['-s',serial,'shell',...argv],{timeout:12000,maxBuffer:32768})).stdout.trim();
  const values=await Promise.allSettled([read('getprop','ro.product.model'),read('getprop','ro.build.version.release'),
   read('getprop','ro.kernel.qemu'),read('dumpsys','package','com.android.chrome')]);
  const value=i=>values[i].status==='fulfilled'?values[i].value:null;
  const chrome=value(3)?.match(/versionName=([^\s]+)/)?.[1]??null;
  console.log(JSON.stringify({status:value(2)==='1'?'ANDROID_EMULATOR_ATTACHED':'ANDROID_DEVICE_ATTACHED',
   model:value(0),androidVersion:value(1),chromeVersion:chrome,emulatorReported:value(2)==='1',
   hardwareAttested:false,androidAcceptancePassed:false,deviceIdentifiersPrinted:false,
   next:'打开 device-check.html 执行九项；检测到设备不代表触摸／剪贴板／钱包测试通过'},null,2));
 }
}catch(e){
 console.error(JSON.stringify({status:'ANDROID_PREFLIGHT_UNAVAILABLE',reason:e.code??'adb_failed',
  androidAcceptancePassed:false,next:'设置ADB为Android SDK中adb的绝对路径；也可在手机直接进行手动验收'},null,2));
 process.exitCode=1;
}
