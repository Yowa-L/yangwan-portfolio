(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('#motion-toggle');
  let paused = preference.matches;
  let overlay = false;
  let explicitChoice = false;
  const media = new Set();
  const widgets = new Set();
  const allowed = () => !paused && !overlay && !document.hidden;

  function updateVideo(state) {
    const play = state.visible && allowed() && !state.userPaused;
    clearTimeout(state.release);
    if (play) {
      const video = state.video;
      if (!video.hasAttribute('src')) {
        video.src = state.src;
        video.addEventListener('loadedmetadata', () => {
          if (state.time && Number.isFinite(video.duration)) video.currentTime = state.time % video.duration;
        }, { once: true });
      }
      if (video.paused) video.play().catch(() => {
        state.host.classList.add('play-blocked');
      });
    } else {
      state.video.pause();
      if (!state.visible) state.release = setTimeout(() => {
        if (state.visible) return;
        state.time = state.video.currentTime;
        state.video.removeAttribute('src');
        state.video.load();
        state.host.classList.remove('is-playing');
      }, 1800);
    }
  }
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = [...media].find(state => state.target === entry.target);
      if (state) { state.visible = entry.isIntersecting && entry.intersectionRatio > .12; updateVideo(state); }
    });
  }, { threshold: [0, .12], rootMargin: '-64px 0px 0px' });

  function registerVideo(video, host, src, target = host) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'none';
    video.removeAttribute('autoplay');
    video.removeAttribute('src');
    const state = { video, host, src, target, visible: false, time: 0 };
    media.add(state);
    video.addEventListener('playing', () => {
      host.classList.add('is-playing'); host.classList.remove('play-blocked');
    });
    // Native controls remain usable; user-initiated pauses persist across visibility updates.
    video.addEventListener('pause', () => {
      if (video.controls && state.visible && allowed() && !video.ended) state.userPaused = true;
    });
    video.addEventListener('play', () => { state.userPaused = false; });
    videoObserver.observe(target);
  }
  document.querySelectorAll('[data-motion-video]').forEach(host => {
    const video = document.createElement('video');
    video.setAttribute('aria-label', host.dataset.title);
    video.setAttribute('aria-hidden', 'true');
    host.prepend(video);
    registerVideo(video, host, host.dataset.motionVideo);
  });

  function sync() {
    toggle.textContent = paused ? '开启动效' : '暂停动效';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.title = paused ? '启动可见页面的动画和静音视频' : '暂停自动动画和视频';
    media.forEach(updateVideo);
    widgets.forEach(state => {
      const active = state.visible && allowed();
      state.root?.host.toggleAttribute('data-running', active);
      state.setRunning?.(active);
      if (state.kind === 'sequence') {
        clearInterval(state.timer);
        if (active && !state.manual) state.timer = setInterval(() => state.setPhase((state.phase + 1) % 4), 3200);
        const button = state.root?.querySelector('#play-sequence');
        if (button) {
          const playing = active && !state.manual;
          button.textContent = playing ? 'Ⅱ 暂停分镜' : '▷ 播放分镜';
          button.setAttribute('aria-pressed', String(playing));
        }
      }
    });
  }
  toggle.addEventListener('click', () => {
    explicitChoice = true; paused = !paused;
    if (!paused) { media.forEach(state => state.userPaused = false); widgets.forEach(state => state.manual = false); }
    sync();
  });
  preference.addEventListener('change', () => { if (!explicitChoice) paused = preference.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('reader:overlay', event => { overlay = event.detail.open; sync(); });

  const resize = new ResizeObserver(entries => entries.forEach(entry => {
    const state = [...widgets].find(state => state.host === entry.target);
    if (state?.layer) state.layer.style.transform = `scale(${entry.contentRect.width / state.nativeWidth})`;
  }));
  async function mount(state) {
    if (state.loading || state.root) return;
    state.loading = true;
    try {
      const response = await fetch(state.host.dataset.widget);
      if (!response.ok) throw new Error('Widget unavailable');
      const data = await response.json();
      const root = state.host.attachShadow({ mode: 'open' });
      state.root = root;
      state.nativeWidth = data.native?.width || 1920;
      const height = data.native?.height || 1080;
      const style = document.createElement('style');
      style.textContent = data.css + `
        :host{display:block;font-family:${data.font};color-scheme:normal}
        *{box-sizing:border-box} .motion-root{position:relative;width:${state.nativeWidth}px;height:${height}px;transform-origin:top left;overflow:hidden}
        .motion-root>.slide{display:block!important;position:absolute!important;inset:0!important;width:1920px!important;height:1080px!important;transform:none!important}
        :host(:not([data-running])) *, :host(:not([data-running])) *::before, :host(:not([data-running])) *::after{animation-play-state:paused!important}
        button:focus-visible{outline:3px solid #b5ae74;outline-offset:3px}
        @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
      `;
      const layer = document.createElement('div');
      layer.className = 'motion-root';
      layer.innerHTML = data.html;
      if(data.background)layer.style.background=data.background;
      root.append(style, layer);
      state.layer = layer;
      layer.style.transform = `scale(${state.host.getBoundingClientRect().width/state.nativeWidth})`;
      resize.observe(state.host);
      if (state.kind === 'orb') {
        layer.style.background = data.background || '#e6e9e3';
        style.textContent += `
          .motion-root>.assistant-bubble{position:absolute!important;inset:50% auto auto 50%!important;transform:translate(-50%,-50%);width:${data.native?.buttonWidth || 378}px!important;height:${data.native?.buttonHeight || 378}px!important;padding:5px}
          .assistant-bubble>svg{width:100%!important;height:100%!important}
        `;
        const button = root.querySelector('.assistant-bubble');
        button.setAttribute('aria-label','Gravita 助手：悬停或点击体验回应动效');
        bindOriginalOrb(state, button);
      }
      if (state.kind === 'cloud-player') bindCloudPlayer(state);
      if (state.kind === 'sequence') bindSequence(state);
      if (state.kind === 'steps') {
        const descriptions = ['沿音乐时间线提示对应乐器，观众看到当前可以参与的位置。','观众敲击亮起的乐器，传感器将操作信号传入 TouchDesigner。','对应音轨加入演奏，人物画面恢复色彩，声音与视觉共同回应观众。'];
        root.querySelectorAll('[data-step]').forEach(button => button.onclick = () => {
          const step = Number(button.dataset.step);
          root.querySelectorAll('[data-step]').forEach(other => {
            other.classList.toggle('selected', other === button);
            other.setAttribute('aria-pressed', String(other === button));
          });
          root.querySelector('#step-description').textContent = descriptions[step];
          root.querySelector('.track-fill').style.width = [8,48,94][step]+'%';
          root.querySelector('.playhead').style.left = [8,48,94][step]+'%';
        });
      }
      root.querySelectorAll('[data-inline-video]').forEach(video => registerVideo(video,video,video.dataset.inlineVideo,video));
      await Promise.all([...root.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
      state.host.classList.add('is-mounted');
      sync();
    } catch (error) {
      // Keep the full static page, with no spinner or blank panel, if enhancement fails.
      state.host.dataset.failed = 'true';
      console.warn('Interactive enhancement unavailable:', state.host.dataset.widget);
    }
  }
  function bindOriginalOrb(state, button) {
    const svg=button.querySelector('svg'),world=svg.querySelector('.assistant-orb-world'),response=svg.querySelector('.assistant-orb-response');
    const shape=svg.querySelector('.assistant-orb-shape').getAttribute('d');
    // The source AssistantSpark.jsx uses this hinge and these exact response keyframes.
    const hinge=degrees=>shape.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,(_,px,py)=>{
      const x=Number(px),y=Number(py),weight=Math.max(0,Math.min(1,(y-47)/14));
      const angle=degrees*Math.PI/180*weight*(x<52?1:-1),dx=x-52,dy=y-34;
      return `${(52+dx*Math.cos(angle)-dy*Math.sin(angle)).toFixed(3)} ${(34+dx*Math.sin(angle)+dy*Math.cos(angle)).toFixed(3)}`;
    });
    let hovered=false,focused=false,running=false,animations=[];
    const settle=()=>world.style.animationPlayState=hovered||focused||running?'paused':'running';
    const react=()=>{
      if(preference.matches||!allowed()||running)return;
      running=true;settle();button.dataset.responding='true';
      const timing={duration:900,easing:'cubic-bezier(.3,0,.2,1)',iterations:1};
      const spin=response.animate([{transform:'rotate(0deg) scale(1)'},{transform:'rotate(175deg) scale(1.055)',offset:.5},{transform:'rotate(360deg) scale(1)'}],timing);
      animations=[spin];
      svg.querySelectorAll('.assistant-orb-shape').forEach(path=>animations.push(path.animate([{d:`path("${shape}")`},{d:`path("${hinge(17)}")`,offset:.34},{d:`path("${hinge(-12)}")`,offset:.7},{d:`path("${shape}")`}],timing)));
      animations.push(svg.querySelector('.assistant-orb-sheen').animate([{opacity:0,transform:'translateX(-70px) rotate(-22deg)'},{opacity:.65,transform:'translateX(-8px) rotate(-22deg)',offset:.42},{opacity:0,transform:'translateX(76px) rotate(-22deg)'}],timing));
      spin.finished.then(()=>{running=false;delete button.dataset.responding;settle()}).catch(()=>{});
    };
    button.addEventListener('pointerenter',()=>{hovered=true;react();settle()});
    button.addEventListener('pointerleave',()=>{hovered=false;settle()});
    button.addEventListener('focus',()=>{focused=true;react();settle()});
    button.addEventListener('blur',()=>{focused=false;settle()});
    button.addEventListener('click',react);
    state.setRunning=active=>animations.forEach(a=>{if(a.playState==='finished'||a.playState==='idle')return;active?a.play():a.pause()});
  }
  function bindCloudPlayer(state) {
    const root=state.root,range=root.querySelector('input[type=range]'),play=root.querySelector('[data-play]');
    let playing=true,position=504,last=0,frame=0;
    const render=()=>{
      range.value=String(position);range.setAttribute('aria-valuetext',`${Math.floor(position/60)}分${Math.floor(position%60)}秒，共30分钟`);
      root.querySelector('[data-time]').textContent=`${String(Math.floor(position/60)).padStart(2,'0')}:${String(Math.floor(position%60)).padStart(2,'0')}`;
      root.querySelector('.player-wave-played').style.clipPath=`inset(0 ${100-position/18}% 0 0)`;
      const controls=root.querySelector('[data-controls-image]'),nextSrc=play.getAttribute(playing?'data-active-src':'data-idle-src');
      if(controls.getAttribute('src')!==nextSrc)controls.src=nextSrc;
      play.setAttribute('aria-label',playing?'暂停播放':'开始播放');play.setAttribute('aria-pressed',String(playing));
    };
    const tick=time=>{const previous=Math.floor(position);if(last&&playing)position=(position+(time-last)/1000)%1800;last=time;if(Math.floor(position)!==previous)render();frame=requestAnimationFrame(tick)};
    state.setRunning=active=>{cancelAnimationFrame(frame);last=0;if(active&&playing)frame=requestAnimationFrame(tick)};
    range.oninput=()=>{position=Number(range.value);render()};
    play.onclick=()=>{playing=!playing;render();state.setRunning(state.visible&&allowed())};
    root.querySelectorAll('[data-skip]').forEach(button=>button.onclick=()=>{position=0;render();root.querySelector('[data-player-status]').textContent=button.dataset.skip==='1'?'已切换下一段 · 播放状态演示':'已切换上一段 · 播放状态演示'});
    root.querySelector('[data-shuffle]').onclick=event=>{const b=event.currentTarget;b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));root.querySelector('[data-player-status]').textContent=b.getAttribute('aria-pressed')==='true'?'随机顺序已开启 · 状态演示':'已恢复顺序播放 · 状态演示'};
    root.querySelector('[data-queue]').onclick=()=>{const q=root.querySelector('[data-queue-list]');q.hidden=!q.hidden};
    render();
  }
  function bindSequence(state) {
    const root = state.root;
    const titles = ['待机引导','检索过渡','生成反馈','回答展开'];
    const captions = ['先让观众识别对话中心，再通过输入提示开始提问。','输入界面与外环逐步隐去，背景退让，中心主体得到强调。','以环形视觉与文本变化承接等待，让处理状态保持可感知。','回答正文出现，关键词与五张相关成果卡片向外围展开。'];
    const chips = [['金紫中心','成果背景','提问提示'],['控件渐隐','背景弱化','主体保留'],['环形反馈','文本流动','中心聚焦'],['回答正文','成果关联','朗读设想']];
    state.phase = 0;
    state.setPhase = index => {
      state.phase = index;
      const image = root.querySelector('#sequence-image');
      image.src = root.querySelector(`.frame-strip [data-phase="${index}"] img`).src;
      image.alt = `${titles[index]}：${captions[index]}`;
      if (!preference.matches) image.animate([{opacity:.35},{opacity:1}],{duration:280});
      root.querySelector('#frame-label').textContent = `${String(index+1).padStart(2,'0')} / ${titles[index]}`;
      root.querySelector('#phase-caption').textContent = captions[index];
      root.querySelector('#phase-chips').replaceChildren(...chips[index].map(text=>{const span=document.createElement('span');span.textContent=text;return span;}));
      root.querySelectorAll('[data-phase]').forEach(button => {
        const selected = Number(button.dataset.phase) === index;
        button.classList.toggle('selected',selected);
        if (button.getAttribute('role')==='tab') { button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1; }
      });
    };
    root.querySelectorAll('[data-phase]').forEach(button => {
      button.onclick = () => { state.manual = true; state.setPhase(Number(button.dataset.phase)); sync(); };
      if (button.getAttribute('role')==='tab') button.onkeydown = event => {
        if (!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(event.key)) return;
        event.preventDefault();state.manual=true;
        state.setPhase((state.phase+(['ArrowDown','ArrowRight'].includes(event.key)?1:3))%4);
        root.querySelector(`.sequence-steps [data-phase="${state.phase}"]`).focus();sync();
      };
    });
    root.querySelector('#play-sequence').onclick = () => {
      if (!allowed()) { paused=false;explicitChoice=true;state.manual=false; }
      else state.manual=!state.manual;
      sync();
    };
  }
  const widgetObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    const state = [...widgets].find(state=>state.host===entry.target);
    state.visible = entry.isIntersecting && entry.intersectionRatio > .12;
    if (state.visible) mount(state);
    sync();
  }), { threshold:[0,.12],rootMargin:'-64px 0px 0px' });
  document.querySelectorAll('[data-widget]').forEach(host => {
    const state = {host,kind:host.dataset.kind,visible:false,manual:false};
    widgets.add(state);widgetObserver.observe(host);
  });
  sync();
})();
