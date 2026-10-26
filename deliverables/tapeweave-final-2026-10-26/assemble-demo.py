import json, pathlib, re, subprocess, time, os
from PIL import Image, ImageDraw, ImageFont

ASSETS = pathlib.Path(__file__).resolve().parent
ROOT = ASSETS/'english' if os.environ.get('TAPEWEAVE_VIDEO_LANGUAGE') == 'en' else ASSETS
FF = '/opt/homebrew/bin/ffmpeg'
FP = '/opt/homebrew/bin/ffprobe'
SPEED = 1.08
scenes = json.loads((ASSETS/'scenes.json').read_text())
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 36)
def duration(path):
    return float(subprocess.check_output([FP,'-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)]))
def run(args):
    subprocess.run([FF,'-hide_banner','-loglevel','error','-y',*args],check=True)
def timestamp(seconds):
    ms=round(seconds*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
offset=0
srt=[]
timeline=[]
for scene in scenes:
    sid=scene['id']; audio=ASSETS/(sid+'.mp3'); video=ROOT/(sid+'.webm')
    deadline=time.monotonic()+600
    while not video.exists():
        if time.monotonic()>deadline:raise RuntimeError('Recording missing: '+sid)
        time.sleep(2)
    original=duration(audio)
    total=(original+1.2)/SPEED
    # Sentence-sized captions remain readable; PNG plates avoid platform-specific subtitle filters.
    chunks=[]
    for sentence in re.split(r'(?<=[.!?])\s+',scene['voice']):
        words=sentence.split()
        while words:
            n=min(14,len(words));chunks.append(' '.join(words[:n]));words=words[n:]
    weight=sum(len(c.split()) for c in chunks)
    cursor=0.2/SPEED
    inputs=['-i',str(video),'-i',str(audio)]
    filters=[f'[0:v]setpts=PTS/{SPEED},scale=1920:1080:flags=lanczos,fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=3,trim=duration={total}[base]']
    previous='base'
    for index,caption in enumerate(chunks):
        length=original/SPEED*len(caption.split())/weight
        end=min(total,cursor+length)
        image=Image.new('RGBA',(1920,150),(12,29,23,250));draw=ImageDraw.Draw(image)
        lines=[];line=''
        for word in caption.split():
            candidate=(line+' '+word).strip()
            if draw.textlength(candidate,font=font)>1730:
                lines.append(line);line=word
            else:line=candidate
        if line:lines.append(line)
        y=(150-len(lines)*45)/2
        for line in lines:
            draw.text(((1920-draw.textlength(line,font=font))/2,y),line,font=font,fill='white');y+=45
        plate=ROOT/'raw'/f'{sid}-caption-{index:02}.png';image.save(plate)
        inputs+=['-i',str(plate)]
        current=f'v{index}'
        filters.append(f'[{previous}][{index+2}:v]overlay=0:930:enable=\'between(t,{cursor:.6f},{end:.6f})\'[{current}]')
        previous=current
        srt.append(f'{len(srt)+1}\n{timestamp(offset+cursor)} --> {timestamp(offset+end)}\n{caption}\n')
        cursor=end
    filters.append(f'[1:a]atempo={SPEED},adelay=185|185,apad,atrim=duration={total}[audio]')
    target=ROOT/'raw'/(sid+'-final.mp4')
    run([*inputs,'-filter_complex',';'.join(filters),'-map',f'[{previous}]','-map','[audio]','-t',str(total),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(target)])
    timeline.append({'scene':sid,'start':offset,'duration':duration(target),'file':str(target)})
    offset+=duration(target)
    print('ASSEMBLED',sid,flush=True)
(ROOT/'TapeWeave-English.srt').write_text('\n'.join(srt))
manifest=ROOT/'raw'/'concat.txt'
manifest.write_text('\n'.join("file '"+t['file'].replace("'","'\\''")+"'" for t in timeline))
run(['-f','concat','-safe','0','-i',str(manifest),'-c','copy','-movflags','+faststart',str(ROOT/'TapeWeave-Final-Demo.mp4')])
run(['-ss','22','-i',str(ROOT/'TapeWeave-Final-Demo.mp4'),'-frames:v','1',str(ROOT/'TapeWeave-Thumbnail.jpg')])
(ROOT/'video-timeline.json').write_text(json.dumps({'speed':SPEED,'duration':duration(ROOT/'TapeWeave-Final-Demo.mp4'),'scenes':timeline},indent=2))
print('FINAL',duration(ROOT/'TapeWeave-Final-Demo.mp4'))
