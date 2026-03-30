let sValue = 14.75, score = 0, step = 0; // Começa com o valor real de Março/2026
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
    let h = `<h2 style="color:var(--gold); margin-bottom:30px; letter-spacing:1px;">${q.q}</h2>`;
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

// BUSCA A SELIC REAL NO BANCO CENTRAL (SÉRIE 432)
async function atualizarMercado() {
    try {
        const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const data = await res.json();
        if(data[0]) {
            sValue = parseFloat(data[0].valor); // Aqui ele pega os 14.75% oficiais
            document.getElementById('selic').innerText = sValue.toFixed(2) + "%";
            const el = document.getElementById('selic');
            el.classList.add('pulse-update');
            setTimeout(() => el.classList.remove('pulse-update'), 800);
        }
    } catch(e) { 
        console.log("BCB Offline - Mantendo 14.75%"); 
    }
    calc();
}

function calc() {
    const i = parseFloat(document.getElementById('ini').value) || 0;
    const m = parseFloat(document.getElementById('mes').value) || 0;
    const t = parseInt(document.getElementById('tempo').value) || 1;
    const p = score > 7 ? "AGRESSIVO" : score > 4 ? "MODERADO" : "CONSERVADOR";
    document.getElementById('top-perfil').innerText = p;

    const sM = Math.pow(1 + (sValue/100), 1/12) - 1;
    let irVal = t > 24 ? 15 : t > 12 ? 17.5 : 22.5;
    document.getElementById('ir').innerText = irVal + "%";

    let inv = i + (m * t);
    let bruto = (i * Math.pow(1 + sM, t)) + (m * ((Math.pow(1 + sM, t) - 1) / sM));
    let lucro = (bruto - inv) * (1 - (irVal/100));
    
    realGlobal = inv + lucro;
    moldGlobal = inv + (lucro * 0.5); // REGRA: -50%

    document.getElementById('v-mold').innerText = "R$ " + moldGlobal.toLocaleString('pt-BR', {minimumFractionDigits:2});

    // ATUALIZA GRÁFICO
    const width = document.getElementById('svg').clientWidth || 300;
    let sens = (lucro / (inv || 1));
    let y3 = Math.max(5, 40 - (sens * 100));
    document.getElementById('path').setAttribute("d", `M30,60 Q${width/2},${Math.max(10, 50-(sens*50))} ${width-30},${y3}`);
    document.getElementById('d3').setAttribute("cx", width-30); document.getElementById('d3').setAttribute("cy", y3);

    // CARDS E STAKES
    const prod = p=="AGRESSIVO" ? ["AÇÕES","CRIPTO","OPÇÕES"] : p=="MODERADO" ? ["FIIs","AÇÕES","CDB"] : ["TESOURO","CDB","LCI"];
    let hP = "";
    prod.forEach((n, idx) => {
        let valProd = (moldGlobal * [0.5, 0.3, 0.2][idx]).toLocaleString('pt-BR', {maximumFractionDigits:0});
        hP += `<div class="c"><span style="font-size:7px;color:var(--blue);font-weight:900;">${n}</span><br><b>R$ ${valProd}</b></div>`;
    });
    document.getElementById('grid-p').innerHTML = hP;

    let hF = "";
    for(let j=1; j<=3; j++) hF += `<tr><td>${t+j}</td><td style="color:var(--accent)">ENTRA</td><td>R$ ${(moldGlobal*0.01/j).toFixed(2)}</td></tr>`;
    document.getElementById('fav').innerHTML = hF;
}

// MODO AUDITORIA (TOQUE LONGO)
const dV = document.getElementById('v-mold');
const audit = (s) => { 
    dV.innerText = "R$ " + (s?realGlobal:moldGlobal).toLocaleString('pt-BR', {minimumFractionDigits:2}); 
    dV.style.color = s?"var(--accent)":"var(--gold)"; 
};
dV.onmousedown = () => audit(true); dV.onmouseup = () => audit(false);
dV.ontouchstart = (e) => { e.preventDefault(); audit(true); }; dV.ontouchend = () => audit(false);

setInterval(atualizarMer
            cado, 60000);
