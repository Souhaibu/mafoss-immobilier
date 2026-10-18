// Moteur 3D WebGL orthographique sans dépendance, avec tampon de profondeur.
// Il dessine uniquement sur interaction ou redimensionnement (aucune boucle au repos).
export function initResidence(canvas){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true});if(!gl)throw new Error('WebGL indisponible');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader 3D indisponible');return s};
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec3 position; attribute vec3 color; varying vec3 tint; void main(){gl_Position=vec4(position,1.0);tint=color;}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 tint; uniform vec3 lighting; void main(){gl_FragColor=vec4(tint*lighting,1.0);}'));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Programme 3D indisponible');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const pos=gl.getAttribLocation(program,'position'),col=gl.getAttribLocation(program,'color');gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(col);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(col,3,gl.FLOAT,false,24,12);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  const light=gl.getUniformLocation(program,'lighting');
  let yaw=-.57,pitch=.55,zoom=1,roof=true,evening=false,w=0,h=0,frame=0,drag=null;
  const scene=[];
  const colors={stone:'#e1d4b7',sand:'#d5c7aa',wall:'#f0e5ce',wood:'#947247',glass:'#36585c',leaf:'#648165',trunk:'#99805b'};
  function face(points,color,kind='building',stroke=null){scene.push({points,color,kind,stroke})}
  function box(x,y,z,sx,sy,sz,color,kind='building'){
    const a=[x,y,z],b=[x+sx,y,z],c=[x+sx,y,z+sz],d=[x,y,z+sz],e=[x,y+sy,z],f=[x+sx,y+sy,z],g=[x+sx,y+sy,z+sz],i=[x,y+sy,z+sz];
    face([a,b,f,e],shade(color,.94),kind);face([b,c,g,f],shade(color,.77),kind);face([c,d,i,g],shade(color,.86),kind);face([d,a,e,i],shade(color,.88),kind);face([e,f,g,i],shade(color,1.07),kind);
  }
  function shade(hex,f){const n=parseInt(hex.slice(1),16),v=[n>>16,(n>>8)&255,n&255].map(x=>Math.min(255,Math.round(x*f)));return `rgb(${v.join(',')})`}
  function leaf(x,y,z,r,angle,len){const dx=Math.cos(angle),dz=Math.sin(angle);const points=[[x,y,z],[x+dx*len*.48-dz*r,y+.28,z+dz*len*.48+dx*r],[x+dx*len,y-.6,z+dz*len],[x+dx*len*.48+dz*r,y+.28,z+dz*len*.48-dx*r]];face(points,angle%1>.5?'#597853':'#769569','plant')}
  function palm(x,z,height){box(x,.15,z,.15,height,.15,colors.trunk,'plant');for(let k=0;k<9;k++)leaf(x,height,z,.3,k*Math.PI*2/9,2+Math.sin(k*7)*.4)}
  function shrub(x,z,size=.7){for(let k=0;k<6;k++){const a=k*Math.PI/3;const px=x+Math.cos(a)*size,pz=z+Math.sin(a)*size;face([[x,.16,z],[px,.3,pz],[x,.9+size*.4,z]],k%2?'#65805b':'#7e9368','plant')}}
  function build(){scene.length=0;
    box(-10,-.5,-8,20,.5,16,'#d6d3bd','ground');
    box(-9.5,0,-7.5,19,.07,15,'#c9cbb1','ground');
    box(-7.6,.08,-6.4,15.1,.10,12.1,colors.sand,'ground');
    // Bordures et murs bas de la parcelle.
    box(-9.5,0,7.2,19,.65,.23,'#c2b99f');box(-9.5,0,-7.5,.23,.65,15,'#cdc5ad');
    // Volumes habitables et façade ouverte sur la cour.
    box(-5.7,.2,-1.8,11.2,3.15,6.7,colors.wall);
    box(-6.1,3.35,-2.2,12,.25,7.6,colors.stone);
    box(-5.7,3.6,-.4,6.3,3.1,5.2,colors.wall);
    box(.6,3.6,1.15,4.9,3.1,3.65,colors.wall);
    // Baies vitrées : cadres bronze et panneaux réfléchissants.
    for(let k=0;k<6;k++){
      box(-5.3+k*1.72,.35,-1.86,1.57,2.76,.08,colors.glass);
      box(-5.3+k*1.72,.35,-1.92,.065,2.76,.06,colors.wood);
      face([[-5.18+k*1.72,.6,-1.94],[-4.99+k*1.72,.6,-1.94],[-4.17+k*1.72,2.9,-1.94],[-4.36+k*1.72,2.9,-1.94]],'#547273');
    }
    for(let k=0;k<3;k++){box(-5.2+k*1.85,3.85,-.46,1.7,2.4,.08,colors.glass);box(-5.2+k*1.85,3.85,-.51,.07,2.4,.04,colors.wood)}
    for(let k=0;k<3;k++)box(.82+k*1.48,3.8,1.08,1.35,2.5,.08,colors.glass);
    // Dallage et profonde terrasse ombragée.
    box(-6.3,.2,-3.35,12.4,.15,1.7,colors.stone);
    for(let k=0;k<13;k++)box(-6+k*.96,.355,-3.35,.012,.006,1.6,'#bfb59c');
    box(.7,3.61,-2.1,4.8,.08,3.15,'#d6c7a8');
    // Garde-corps léger sur terrasse.
    for(let k=0;k<9;k++)box(-5.9+k*1.4,3.6,-2.12,.045,.88,.045,'#80765d');
    box(-5.95,4.44,-2.12,11.6,.045,.045,'#a18d65');
    for(let k=0;k<3;k++)box(5.7,3.6,-1.9+k*1.12,.045,.88,.045,'#80765d');
    // Brise-soleil latéraux en bois.
    for(let k=0;k<13;k++)box(-5.84,.3,-1.75+k*.48,.18,6.1,.10,colors.wood);
    // Colonnes, toiture et pergola amovible.
    box(5.5,.2,-2.02,.25,6.5,.25,colors.stone);box(.55,3.6,-1.98,.19,3.1,.19,colors.stone);
    box(-6.05,6.7,-.75,6.9,.28,5.9,colors.stone,'roof');box(.6,6.7,1,5.3,.28,4.15,colors.stone,'roof');
    for(let k=0;k<13;k++)box(.65+k*.4,6.64,-2.25,.13,.18,3.45,colors.wood,'roof');
    box(.5,6.62,-2.25,5.5,.22,.15,colors.wood,'roof');
    // Mobilier extérieur.
    box(2.4,3.69,-.9,1.5,.45,.65,'#b6a784');box(2.4,4.1,-.9,1.5,.3,.15,'#c7b99b');box(2.4,4.13,-.74,1.5,.12,.5,'#e6dcc5');
    box(3,3.69,.15,.7,.38,.55,'#967951');
    box(-3.5,.35,-3.15,2,.4,.66,'#b29c74');box(-3.5,.75,-3.15,2,.13,.66,'#ece4d2');
    // Bassin et margelles en pierre.
    box(-4.9,.15,-6.7,8.7,.11,2.9,'#e8ddc2');box(-4.64,.265,-6.44,8.18,.015,2.38,'#4e9da4');
    for(let k=0;k<12;k++)face([[-4.5,.284,-6.3+k*.18],[3.4,.284,-6.3+k*.18],[3.4,.284,-6.28+k*.18],[-4.5,.284,-6.28+k*.18]],'#7ab9b8');
    // Chaises longues et allée en dalles.
    for(let k=0;k<2;k++){box(4.3+k*1.3,.2,-6.2,.8,.3,1.9,'#967951');box(4.3+k*1.3,.5,-6.2,.8,.12,1.5,'#ece1c9')}
    for(let k=0;k<5;k++)box(7.4,.08,-5.8+k*1.2,1.1,.09,.85,'#ddd7bd');
    palm(-8,-4.7,5.3);palm(8,4.6,6.5);palm(-7.9,4.7,5.6);
    [[-8,-1],[-8,1.1],[-7,-6.6],[7,-2.4],[7,0],[6.6,5.7],[-3,6.1],[0,6.1]].forEach(([x,z],i)=>shrub(x,z,.6+(i%3)*.16));
    box(4.5,3.69,.3,.65,.48,.65,'#b0a184');shrub(4.8,.6); // Le vrai arbuste de terrasse est dessiné à sa hauteur.
    for(let k=0;k<7;k++)leaf(4.8,4.65,.6,.13,k*.9,.65);
  }
  build();
  function project(p){const x=p[0]*Math.cos(yaw)-p[2]*Math.sin(yaw),z=p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);const scale=Math.min(w/25,h/18)*zoom;return [w/2+x*scale,h*.64+(-z*Math.sin(pitch)-p[1]*Math.cos(pitch))*scale,z*Math.cos(pitch)-p[1]*Math.sin(pitch)]}
  function rgb(color){if(color.startsWith('#')){const n=parseInt(color.slice(1),16);return [n>>16,(n>>8)&255,n&255].map(v=>v/255)}return color.match(/[\d.]+/g).map(Number).map(v=>v/255)}
  function draw(){frame=0;if(!w||!h)return;gl.clearColor(evening?.52:0,evening?.55:0,evening?.51:0,evening?1:0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform3f(light,evening?1.03:1,evening?.93:1,evening?.78:1);
    const vertices=[];for(const f of scene){if(!roof&&f.kind==='roof')continue;const color=rgb(f.color),ps=f.points.map(project);for(let i=1;i<ps.length-1;i++)for(const p of [ps[0],ps[i],ps[i+1]])vertices.push(p[0]/w*2-1,1-p[1]/h*2,p[2]/40,...color)}
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/6);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(draw)}
  function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);schedule()}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#model-instructions').textContent='Affichage 3D interrompu. Rechargez la page pour reprendre.'});
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};if(e.pointerType!=='touch')canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dx)<10)return;yaw=drag.yaw+dx*.009;pitch=Math.max(.25,Math.min(.95,drag.pitch-dy*.004));schedule()});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,()=>drag=null));
  canvas.addEventListener('pointerleave',e=>{if(!canvas.hasPointerCapture(e.pointerId))drag=null});
  function scaleBy(delta){zoom=Math.max(.65,Math.min(1.5,zoom+delta));schedule()}
  canvas.addEventListener('wheel',e=>{if(document.activeElement!==canvas)return;e.preventDefault();scaleBy(e.deltaY<0?.08:-.08)},{passive:false});
  canvas.addEventListener('click',()=>canvas.focus({preventScroll:true}));
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=Math.min(.95,pitch+.06);if(e.key==='ArrowDown')pitch=Math.max(.25,pitch-.06);if(e.key==='+'||e.key==='=')scaleBy(.1);if(e.key==='-')scaleBy(-.1);schedule()}});
  document.querySelector('#rotate-left').onclick=()=>{yaw-=.25;schedule()};document.querySelector('#rotate-right').onclick=()=>{yaw+=.25;schedule()};document.querySelector('#zoom-in').onclick=()=>scaleBy(.1);document.querySelector('#zoom-out').onclick=()=>scaleBy(-.1);
  document.querySelector('#model-reset').onclick=()=>{yaw=-.57;pitch=.55;zoom=1;schedule()};
  document.querySelector('#roof-toggle').onclick=e=>{roof=!roof;e.currentTarget.setAttribute('aria-pressed',!roof);e.currentTarget.textContent=roof?'Retirer le toit':'Remettre le toit';schedule()};
  document.querySelector('#light-toggle').onclick=e=>{evening=!evening;e.currentTarget.setAttribute('aria-pressed',evening);e.currentTarget.textContent=evening?'Lumière du jour':'Lumière du soir';schedule()};resize();
}
