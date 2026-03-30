let sValue = 10.75, score = 0, step = 0;
let realGlobal = 0, moldGlobal = 0;

const qs = [
    {q: "OBJETIVO?", o: ["SEGURANÇA", "RENDA", "RIQUEZA"], v: [1,2,3]},
    {q: "ACEITA RISCO?", o: ["NÃO", "TALVEZ", "SIM"], v: [1,2,3]},
    {q: "TEMPO?", o: ["CURTO", "MÉDIO", "LONGO"], v: [1,2,3]}
];

function startQuiz() {
    document.getElementById('splash').style.display='none';
    document.getElementById('quiz').style.display='flex';
    showQ();
}

function showQ() {
    const q = qs[step];
    let h = `<h2 style="color:var(--gold); margin-bottom:30px;">${q.q}</h2>`;
    q.o.forEach((opt, i) => h += `<div class="opt" onclick="next(${q.v[i]})">${opt}</div>`);
    document.getElementById('q-box').innerHTML = h;
}

function next(v) {
    score += v; step++;
    if(step < qs.length) showQ();
    else {
        document.getElementById('quiz').style.display='none';
        document.getElementById('main').style.display='block';
        atualizarMercado();
    }
}

async function atualizarMercado() {
    try {
        const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const data = await res.json();
        if(data[0]) {
            sValue = parseFloat(data[0].valor);
            document.getElementById('selic').innerText = sValue.toFixed(2) + "%";
            const el = document.getElementById('selic');
            el.classList.add('pulse-update');
            setTimeout(() => el.classList.remove('pulse-update'), 800);
        }
    } catch(e) { console.log("BCB Offline"); }
    calc();
}

function calc() {
    const i = parseFloat(document.getElementById('ini').value) || 0;
    const m = parseFloat(document.getElementById('mes').value) || 0;
    const t = parseInt(document.getElementById('tempo').value) || 1;
    const p = score > 7 ? "AGRESSIVO" : score > 4 ? "MODERADO" : "CONSERVADOR";
    document.getElementById('top-perfil').innerText = p;

    const taxaM = Math.pow(1 + (sValue/100), 1/12) - 1;
    let irTaxa = t > 24 ? 0.15 : t > 12 ? 0.175 : 0.225;
    document.getElementById('ir').innerText = (irTaxa * 100).toFixed(1) + "%";

    const bruto = (i * Math.pow(1 + taxaM, t)) + (m * ((Math.pow(1 + taxaM, t) - 1) / taxaM));
    const inv = i + (m * t);
    const lucroLiq = (bruto - inv) * (1 - irTaxa);

    realGlobal = inv + lucroLiq;
    moldGlobal = inv + (lucroLiq * 0.5);

    document.getElementById('v-mold').innerText = moldGlobal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    
    const svgW = document.getElementById('svg').clientWidth || 300;
    const y3 = Math.max(5, 60 - ((lucroLiq/inv) * 150 || 0));
    document.getElementById('path').setAttribute("d", `M30,60 Q${svgW/2},${y3+10} ${svgW-30},${y3}`);
    document.getElementById('d3').setAttribute("cx", svgW-30); 
    document.getElementById('d3').setAttribute("cy", y3);

    const prod = p=="AGRESSIVO" ? ["AÇÕES","CRIPTO","OPÇÕES"] : p=="MODERADO" ? ["FIIs","AÇÕES","CDB"] : ["TESOURO","CDB","LCI"];
    let hP = "";
    prod.forEach((n, idx) => {
        let vP = (moldGlobal * [0.5, 0.3, 0.2][idx]).toLocaleString('pt-BR', {maximumFractionDigits: 0});
        hP += `<div class="c"><span style="font-size:7px;color:var(--blue); font-weight:900;">${n}</span><br><b>R$ ${vP}</b></div>`;
    });
    document.getElementById('grid-p').innerHTML = hP;

    let hF = "";
    for(let j=1; j<=3; j++) hF += `<tr><td>${t+j}</td><td style="color:var(--accent)">ENTRA</td><td>R$ ${(moldGlobal*0.01/j).toFixed(2)}</td></tr>`;
    document.getElementById('fav').innerHTML = hF;
}

const dV = document.getElementById('v-mold');
const audit = (s) => { 
    dV.innerText = (s?realGlobal:moldGlobal).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}); 
    dV.style.color = s?"var(--accent)":"var(--gold)"; 
};
dV.onmousedown = () => audit(true); dV.onmouseup = () => audit(false);
dV.ontouchstart = (e) => { e.preventDefault(); audit(true); }; dV.ontouchend = () => audit(false);

setInterval(atualizarMer
                                                            cado, 60000);
