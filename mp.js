        class StochasticSimulation {
            constructor() {
               

                this.numScenarios = 5000;
                this.numSamplePaths = parseInt(document.getElementById('ctiSce').value);
                this.startDate = new Date(); // (month is 0-indexed)
                this.endDate = new Date(2026, 3, 22); // 
                this.timeHorizon = Math.round((this.endDate - this.startDate) /(24 * 60 * 60 * 1000) );//(this.endDate.getFullYear() - this.startDate.getFullYear()) * 12 +  (this.endDate.getMonth() - this.startDate.getMonth());//17; // months from now to May 2026
                
                this.dt = 1/(52); // weekly steps
                this.numSteps = Math.floor(this.timeHorizon/7); // / this.dt);
                
                // Model parameters
                this.F0 = parseFloat(document.getElementById('futurePrice').value);
                this.muF = 0.0;
                this.sigmaF = 0.01*parseFloat(document.getElementById('volatilityPrice').value);
                
                this.R0 = parseFloat(document.getElementById('estimatedYield').value);
                this.muR = 0.0;
                this.sigmaR = parseFloat(document.getElementById('stdYield').value);

                this.cost = parseFloat(document.getElementById('cost').value);
                this.Margen_reserva = parseFloat(document.getElementById('Margen_reserva').value);

                
                this.timeArray = [];
                this.scenarios = {
                    F: [],
                    R: [],
                    M: [],
                    FH: [],
                    RH: [],
                    MH: []
                    
                };
                
                
                this.isRunning = false;
                this.initializeCharts();
                this.setupEventListeners();
            }

            generateTimeArray() {
                const now = new Date();
                const times = [];
                for (let i = 0; i <= this.numSteps; i++) {
                    const date = new Date(now);
                    date.setDate(date.getDate() + 7*i);
                    times.push(date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })); // YYYY-MM format
                }
                return times;
            }

            normalRandom(rand) {

                

                let u = 0, v = 0;
                while(u === 0) u = rand();
                while(v === 0) v = rand();
                return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            }

            async runSimulation() {


                
                // Box-Muller transform
                // Usage
                let rand = Math.random;
                const fixedRand = document.getElementById('fijarAlea').checked;
                if (fixedRand) { rand = mulberry32(12345);} 


                

                this.numScenarios = 5000;
                this.numSamplePaths = parseInt(document.getElementById('ctiSce').value);
                this.startDate = new Date(); // (month is 0-indexed)
                this.endDate = new Date(2026, 3, 22); // 
                this.timeHorizon = Math.round((this.endDate - this.startDate) /(24 * 60 * 60 * 1000) );//(this.endDate.getFullYear() - this.startDate.getFullYear()) * 12 +  (this.endDate.getMonth() - this.startDate.getMonth());//17; // months from now to May 2026
                
                this.dt = 1/(52); // weekly steps
                this.numSteps = Math.floor(this.timeHorizon/7); // / this.dt);
                
                // Model parameters
                this.F0 = parseFloat(document.getElementById('futurePrice').value);
                this.muF = 0.0;
                this.sigmaF = 0.01*parseFloat(document.getElementById('volatilityPrice').value);
                
                this.R0 = parseFloat(document.getElementById('estimatedYield').value);
                this.muR = 0.0;
                this.sigmaR = parseFloat(document.getElementById('stdYield').value);

                this.cost = parseFloat(document.getElementById('cost').value);
                

                // hedge parameters

                
                this.psellingFwd = 0.01*parseFloat(document.getElementById('sellingFwdNumber').value);
                this.psellingFwdRegular= 0.01*parseFloat(document.getElementById('sellingFwdRegularNumber').value);
                this.nbFixing = parseInt(document.getElementById('nbFixing').value);
                this.pbuyingPricePut = 0.01*parseFloat(document.getElementById('buyingPricePutNumber').value);
                this.pricePutStrike = parseFloat(document.getElementById('pricePutStrike').value);
                this.psellPriceCall = 0.01*parseFloat(document.getElementById('sellPriceCallNumber').value);
                this.priceCallStrike = parseFloat(document.getElementById('priceCallStrike').value);
                this.pbuyYieldPut = 0.01*parseFloat(document.getElementById('buyYieldPutNumber').value);
                this.yieldPutStrike = parseFloat(document.getElementById('yieldPutStrike').value);
                this.pbuyMarginPut = 0.01*parseFloat(document.getElementById('buyMarginPutNumber').value);
                this.marginPutStrike = parseFloat(document.getElementById('marginPutStrike').value);
                this.pdiversificationYield = 0.01*parseFloat(document.getElementById('diversificationYieldNumber').value);
                this.pdiversificationStdYield = 0.01*parseFloat(document.getElementById('diversificationStdYieldNumber').value);
                this.pdiversificationCosto = 0.01*parseFloat(document.getElementById('diversificationCostoNumber').value);
                this.pcorr_precio = 0.01*parseFloat(document.getElementById('corr_precioNumber').value);
                
                this.Margen_reserva = parseFloat(document.getElementById('Margen_reserva').value);
                
                
                this.timeArray = [];
                this.scenarios = {
                    F: [],
                    R: [],
                    M: [],
                    FH: [],
                    RH: [],
                    MH: []
                    
                };
                


                if (this.isRunning) return;
                
                this.isRunning = true;
                document.getElementById('runSimulation').disabled = true;
                document.getElementById('progressContainer').style.display = 'block';
                
                this.timeArray = this.generateTimeArray();
                this.scenarios = { F: [], R: [], M: [],FH: [], RH: [], MH: [] };

                this.minF = this.F0;
                this.maxF = this.F0;
                this.minR = this.R0;
                this.maxR = this.R0;
                this.minM = this.R0 * this.F0 - this.cost;
                this.maxM = this.R0 * this.F0 - this.cost;
                
                
                // Generate all scenarios
                for (let scenario = 0; scenario < this.numScenarios; scenario++) {

                    
                    let reachedFwdDate = false;
                    let fwdSellValue = 0;

                    let nbFixinMax = Math.min(this.numSteps,this.nbFixing);
                    let BetweenFixing = Math.floor(this.numSteps/nbFixinMax);
                    let k = 0;
                    let fwdRegPaceSum = 0.0;
                    let fwdRegPace = 0.0;

                    let fwdOneDay = 0.0;
                    
                    let RH0 = this.R0*(1+this.pdiversificationYield);
                    let FH0 = this.R0*(1+this.pcorr_precio);
                    
                    let sigmaRH0 = this.sigmaR*(1+this.pdiversificationStdYield);
                    let costH0= this.cost*(1+this.pdiversificationCosto);
                    

                    const now = new Date();

                    // buy price put
                    let PricePut = blackScholesPut(this.F0, this.pricePutStrike, 0.0, this.timeHorizon/365, this.sigmaF);
                    
                    // sell price call
                    let PriceCall = blackScholesCall(this.F0, this.priceCallStrike, 0.0, this.timeHorizon/365, this.sigmaF);

                    // buy price yield
                    let YieldPut = bachelierPut(this.R0, this.yieldPutStrike, 0.0, this.timeHorizon/365, 1.5* this.sigmaR);
                    
                    // buy margin put, with big approx
                    let MarginPut = bachelierPut(this.R0 * this.F0 - costH0, this.marginPutStrike, 0.0, this.timeHorizon/365, 2*Math.sqrt(this.sigmaF*this.F0*this.sigmaF*this.F0 + this.sigmaR*this.sigmaR));

                    const F_path = [this.F0];
                    FH0 = this.F0 + this.pbuyingPricePut*(-PricePut + Math.max(this.pricePutStrike - this.F0, 0))
                    + this.psellPriceCall*(PriceCall - Math.max(-this.priceCallStrike + this.F0, 0));
                    const FH_path = [FH0];
                    
                    let RH1_prev = RH0;
                    const R_path = [this.R0];
                    RH0 = RH0 + this.pbuyYieldPut*(-YieldPut+ Math.max(this.yieldPutStrike - RH0, 0));
                    const RH_path = [RH0];
                    
                    const M_path = [this.R0 * this.F0 - this.cost];
                    const MH_path = [RH0 * FH0 - costH0 + this.pbuyMarginPut * (-MarginPut+ Math.max(this.marginPutStrike - (RH0 * FH0 - costH0),0))];


                    
                    for (let step = 0; step < this.numSteps; step++) {
                        const dW1 = this.normalRandom(rand) * Math.sqrt(this.dt);
                        const dW2 = this.normalRandom(rand) * Math.sqrt(this.dt);

                        // Black-Scholes for F (geometric Brownian motion)
                        const F_prev = F_path[F_path.length - 1];
                        const F_new = F_prev * Math.exp((- 0.5 * this.sigmaF * this.sigmaF) * this.dt + this.sigmaF * dW1);
                        F_path.push(F_new);
                        
                        // fwd sell hedge
                        const SellFwdDate = new Date(document.getElementById('sellFwdDate').value);                       
                        const currentDate = new Date(now.getTime() + 7 * step * 24 * 60 * 60 * 1000);
                        if (SellFwdDate <= currentDate && !reachedFwdDate) {
                                fwdSellValue = F_prev;
                                reachedFwdDate = true;
                            }
                        fwdOneDay = (SellFwdDate <= currentDate) ? fwdSellValue : F_new;
                        
                        // fwd regular pace
                        if (step === BetweenFixing*k) 
                        {
                            fwdRegPaceSum+=F_prev;
                            k+=1;
                        }  
                        fwdRegPace = (fwdRegPaceSum + (nbFixinMax - k)*F_new)/nbFixinMax;
                        
                        // price put
                        const FwPricePut = - PricePut + Math.max(this.pricePutStrike - F_new, 0);
                       
                        // price call
                        const FwPriceCall = + PriceCall - Math.max(-this.priceCallStrike + F_new, 0);
                        
                        // Bachelier for R (arithmetic Brownian motion)
                        const R_prev = R_path[R_path.length - 1];
                        const R_new = R_prev  + this.sigmaR * dW2;
                        R_path.push(R_new);

                        const FH_new = ((this.R0 * this.psellingFwd) *fwdOneDay + (this.R0 *this.psellingFwdRegular)*fwdRegPace + (R_new - (this.R0 * this.psellingFwd) - (this.R0 * this.psellingFwdRegular))*F_new)/R_new + 
                        this.R0*(this.psellPriceCall*FwPriceCall + this.pbuyingPricePut*FwPricePut)/R_new;
                        FH_path.push(FH_new);

                        
                        const RH_prev = RH1_prev; //RH_path[RH_path.length - 1];
                                             
                        const RH1_new = RH_prev  + sigmaRH0 * dW2;
                        const RH_new = RH1_new + this.pbuyYieldPut * (-YieldPut + Math.max(this.yieldPutStrike - RH1_new, 0));
                        RH_path.push(RH_new);
                        RH1_prev = RH1_new;



                        

                        
                        const M_new = R_new * F_new - this.cost;
                        const MH_new = RH_new * FH_new - costH0 + this.pbuyMarginPut * (-MarginPut + Math.max(this.marginPutStrike - (RH_new * FH_new - costH0),0));



                        M_path.push(M_new);
                        MH_path.push(MH_new);
                        
                        this.minF = (F_new < this.minF) ? F_new : this.minF;
                        this.minR = (R_new < this.minR) ? R_new : this.minR;
                        this.minM = (M_new < this.minM) ? M_new : this.minM;

                        this.maxF = (F_new > this.maxF) ? F_new : this.maxF;
                        this.maxR = (R_new > this.maxR) ? R_new : this.maxR;
                        this.maxM = (M_new > this.maxM) ? M_new : this.maxM;


                    }

                    this.scenarios.F.push(F_path);
                    this.scenarios.R.push(R_path);
                    this.scenarios.M.push(M_path);
                    this.scenarios.FH.push(FH_path);
                    this.scenarios.RH.push(RH_path);
                    this.scenarios.MH.push(MH_path);

                    // Update progress
                    const progress = ((scenario + 1) / this.numScenarios) * 100;
                    document.getElementById('progressBar').style.width = progress + '%';
                    document.getElementById('progressText').textContent = 
                        'preparando la prospección;'; //: ${scenario + 1}/${this.numScenarios}`;

                    if (scenario % 50 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1));
                    }
                }

                // Start animated visualization
                await this.animateCharts();
                
                this.isRunning = false;
                document.getElementById('runSimulation').disabled = false;
                document.getElementById('progressContainer').style.display = 'none';
            }

            calculatePercentiles(data, percentiles) {
                const sorted = data.slice().sort((a, b) => a - b);
                const result = {};
                
                percentiles.forEach(p => {
                    const index = (p / 100) * (sorted.length - 1);
                    if (index === Math.floor(index)) {
                        result[p] = sorted[index];
                    } else {
                        const lower = sorted[Math.floor(index)];
                        const upper = sorted[Math.ceil(index)];
                        result[p] = lower + (upper - lower) * (index - Math.floor(index));
                    }
                });
                
                return result;
            }

async animateCharts() {
    const models = ['F', 'R', 'M', 'FH', 'RH', 'MH'];
    const titles = ['Black-Scholes Model (F)', 'Bachelier Model (R)', 'Derived Variable (M = R×F - 600)'];
    const colors = ['#010B3B', '#0F4801', '#623E01','#010B3B', '#0F4801', '#623E01'];
    const colors2 = ['1, 11, 59', '15, 72, 1', '98, 62, 1','1, 11, 59', '15, 72, 1', '98, 62, 1'];
    
    // Store existing chart data with reduced opacity
    const existingChartData = {};
    
    models.forEach((model, idx) => {
        const chartElement = document.getElementById(`chart${model}`);
        existingChartData[model] = [];
        
        // Check if chart exists and has data
        if (chartElement && chartElement.data && chartElement.data.length > 0) {
            // Store existing traces with reduced opacity
            chartElement.data.forEach((trace, traceIdx) => {
                const preservedTrace = {
                    ...trace,
                    opacity: (trace.opacity || 1) * 0.1, // Reduce opacity to 10%
                    showlegend: false, // Don't show in legend to avoid clutter
                    name: '',
                    hovertemplate: ''
                };
                
				preservedTrace.hoverinfo = 'skip';
				
                // Handle fill colors for confidence bands
                if (trace.fillcolor) {
                    preservedTrace.fillcolor = trace.fillcolor.replace(/rgba\(([^)]+),\s*[\d.]+\)/, 'rgba($1, 0.02)');
                }
                
                // Handle line colors
                if (trace.line && trace.line.color) {
                    if (typeof trace.line.color === 'string') {
                        if (trace.line.color.startsWith('rgba')) {
                            preservedTrace.line = {
                                ...trace.line,
                                color: trace.line.color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, 'rgba($1, 0.1)')
                            };
                        } else {
                            // Convert solid color to rgba with low opacity
                            preservedTrace.line = {
                                ...trace.line,
                                color: trace.line.color + '1A' // Add alpha for hex colors
                            };
                        }
                    }
                }
                
                existingChartData[model].push(preservedTrace);
            });
        }

        // Initialize new chart or clear existing one
        Plotly.newPlot(`chart${model}`, existingChartData[model], {
            legend: {
                x: 0.01,
                y: 0.99,
                xanchor: 'left',
                yanchor: 'top',
                orientation: 'h'
            },
            xaxis: {
                type: 'category',
                tickangle: -45,
                showgrid: true,
                gridcolor: '#f0f0f0',
            },
            yaxis: {
                title: model === 'F' ? 'precio de venta: Mayo26 (USD/t)' : 
                       model === 'R' ? 'rendimiento potencial (t/ha)' :  
                       model === 'M' ? 'margen potencial (USD/ha)' : '',
                showgrid: true,
                side: 'right',
                gridcolor: '#f0f0f0'
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            margin: { t: 5, b: 80, l: 50, r: 60 }
        }, {
            responsive: true,
            displayModeBar: false
        });
    });

    // Progressive animation
    document.getElementById('progressText').textContent = 'calculando simulacion...';
    document.getElementById('progressContainer').style.display = 'block';

    for (let step = 1; step <= this.numSteps; step++) {
        const currentTime = this.timeArray.slice(0, step + 1);
        
        for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
            const model = models[modelIdx];
            const traces = (modelIdx>2) ? [...existingChartData[model]] : []; // Start with existing data
            const bandShapes = [];

            // Sample paths (dotted red lines)
            for (let i = 0; i < this.numSamplePaths; i++) {
                const pathData = this.scenarios[model][i].slice(0, step + 1);
                traces.push({
                    x: currentTime,
                    y: pathData,
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color: colors[modelIdx],
                        width: 1,
                        dash: 'dash'
                    },
                    opacity: 1,
                    name: "unos escenarios",
                    showlegend: false,
                    hovertemplate: (model.charAt(0) === 'F' ? `esc.${i}: %{y:.0f} USD/t<br>%{x}<extra></extra>` : 
                                   model.charAt(0) === 'R' ? `esc.${i}: %{y:.2f} t/ha<br>%{x}<extra></extra>` :  
                                   `esc.${i}: %{y:.0f} USD/ha<br>%{x}<extra></extra>`)
                });
            }

            // Confidence bands
            const percentiles = [1, 5,10, 15,16,17,25, 33, 50, 66, 75, 84, 85,90, 95, 99];
            const bandData = {};
            
            for (let t = 0; t <= step; t++) {
                const values = this.scenarios[model].map(path => path[t]);
                const percs = this.calculatePercentiles(values, percentiles);
                
                percentiles.forEach(p => {
                    if (!bandData[p]) bandData[p] = [];
                    bandData[p].push(percs[p]);
                });
            }

            // Add confidence bands with gradient opacity
            const bandPairs = [
                [1, 99, 0.5],
                [16, 84, 0.8]
            ];

            bandPairs.forEach(([lower, upper, opacity]) => {
                traces.push({
                    x: [currentTime[currentTime.length - 2],currentTime[currentTime.length - 1], currentTime[currentTime.length - 1], currentTime[currentTime.length - 2]],
                    y: [bandData[lower][bandData[lower].length - 2],bandData[lower][bandData[lower].length - 1], bandData[upper][bandData[upper].length - 1], bandData[upper][bandData[upper].length - 2]],
                    fill: 'toself',
                    fillcolor: `rgba(${colors2[modelIdx]}, ${opacity})`,
                    line: { color: 'transparent' },
                    showlegend: true,
                    name : lower=== 1?  "El peor y mejor 15% " : lower===5?  "peor 5%-16%" : lower===16 ? "2 de 3 posibilidades" : "el mejor 17%",
                    hoverinfo: 'skip'
                });
                traces.push({
                    x: currentTime.concat(currentTime.slice().reverse()),
                    y: bandData[lower].concat(bandData[upper].slice().reverse()),
                    fill: 'toself',
                    fillcolor: `rgba(${colors2[modelIdx]}, 0.05*${opacity})`,
                    line: { color: 'transparent' },
                    showlegend: false,
                    name : '',
                    hoverinfo: 'skip'
                });
                traces.push({
                    x: currentTime,
                    y: bandData[lower],
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color: `rgba(${colors2[modelIdx]}, 0.05*${opacity})`,
                        width: 1
                    },
                    name: 'percentil %{lower}%',
                    showlegend: false,
                    hovertemplate: (model.charAt(0) === 'F' ? `perc. ${lower}%: %{y:.0f} USD/t<br>%{x}<extra></extra>` : 
                                   model.charAt(0) === 'R' ? `perc. ${lower}%: %{y:.2f} t/ha<br>%{x}<extra></extra>` :  
                                   `perc. ${lower}%: %{y:.0f} USD/ha<br>%{x}<extra></extra>`)
                }); 
                traces.push({
                    x: currentTime,
                    y: bandData[upper],
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color: `rgba(${colors2[modelIdx]}, 0.1${opacity})`,
                        width: 1
                    },
                    name: '',
                    showlegend: false,
                    hovertemplate: (model.charAt(0) === 'F' ? `percentil ${upper}%: %{y:.0f} USD/t<br>%{x}<extra></extra>` : 
                                   model.charAt(0) === 'R' ? `percentil ${upper}%: %{y:.2f} t/ha<br>%{x}<extra></extra>` :  
                                   `percentil ${upper}%: %{y:.0f} USD/ha<br>%{x}<extra></extra>`)
                }); 
            });

            if (model === 'MH' || model === 'M' ){
                const percsT1 = this.calculatePercentiles(this.scenarios[model].map(path => path[this.numSteps-1]), [1])[1];
                
                for (let i = 0; i < step-2; i += 1) {
                    if (i % 2 !== 0) {
                    bandShapes.push({
                    type: 'line',
                    x0: i,
                    x1: i+2,
                    y0: percsT1,
                    y1: this.Margen_reserva,
                    line: {
                        color: 'red',
                        width: 1,
                        dash: 'dash'
                        },
                    opacity: 0.8,
                    name: 'por debajo del margen mínimo',
                    showlegend: (i===1) ? true : false,
                    layer: 'below'
                    });
                    }
                }

                bandShapes.push(
                    {
                    type: 'line',
                    x0: 0,
                    x1: step,
                    y0: this.Margen_reserva,
                    y1: this.Margen_reserva,
                    line: {
                        color: 'red',
                        width: 1
                    },
                    opacity: 0.8,
                    layer: 'below'
                    },
                );

                bandShapes.push(
                    {
                    type: 'line',
                    x0: 0,
                    x1: step,
                    y0: percsT1,
                    y1: percsT1,
                    line: {
                        color: 'red',
                        width: 1
                    },
                    opacity: 0.8,
                    layer: 'below'
                    },
                );
            }

            const yvalue = bandData[1][0];
            Plotly.react(`chart${model}`, traces,{
                legend: {
                x: 0.01,
                y: 0.99,
                xanchor: 'left',
                yanchor: 'top',
                borderwidth: 1,
                bordercolor: '#a8a8a8',
                orientation: 'h'
                },
                shapes: bandShapes,
                xaxis: {
                    type: 'category',
                    tickangle: -45,
                    showgrid: true,
                    gridcolor: '#f0f0f0',
                    range: [-0.5, this.numSteps + 0.5]
                },
                yaxis: {
                title: model === 'F' ? 'precio de venta: Mayo26 (USD/t)' : 
                       model === 'R' ? 'pronostico de rendimiento (t/ha)' :  
                       model === 'M' ? 'pronostico de margen (USD/ha)' : 
                       model === 'FH' ? 'precio de venta mejorado (USD/t)' : 
                       model === 'RH' ? 'pronostico de rendimiento mejorado (t/ha)' :  
                       model === 'MH' ? 'pronostico de margen mejorada (USD/ha)' : '',
                    showgrid: true,
                    gridcolor: '#f0f0f0',
                    side: 'right',
                    range: [ (model.charAt(0) === 'F' ? 0.9*this.minF : model.charAt(0) === 'R' ? this.minR :  this.minM ), 
                            (model.charAt(0) === 'F' ? 0.9*this.maxF : model.charAt(0) === 'R' ? this.maxR :  0.85*this.maxM )]
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
                margin: { t: 5, b: 80, l: 50, r: 60 },
                annotations: [
                    {
                      x: currentTime[0],
                      y: bandData[1][0],
                      text: (model.charAt(0) === 'F') ? 'la proyección de hoy: '+Math.round(bandData[1][0])+'USD/t' : 
                            (model.charAt(0) === 'R') ? 'la proyección de hoy: '+Math.round(10*bandData[1][0])/10+'t/ha' : 
                            'la proyección de hoy: '+Math.round(bandData[1][0])+'USD/ha',
                      showarrow: true,
                      arrowhead: 6,
                      ax: 40,
                      ay: -40,
                      font: {
                        color: 'red',
                        size: 14
                      },
                      arrowcolor: 'red',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      bordercolor: 'red',
                      borderwidth: 1
                    }
                ]
            });
        }

        // Update progress
        const progress = (step / this.numSteps) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `dibujando las posibilidades de la semana ${this.timeArray[step]} y algunos escenarios`;

        // Control animation speed
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    document.getElementById('progressContainer').style.display = 'none';
}

            initializeCharts() {
                const models = ['F', 'R', 'M', 'FH', 'RH', 'MH'];
                const titles = ['Black-Scholes Model (F)', 'Bachelier Model (R)', 'Derived Variable (M = R×F - 600)'];

                models.forEach((model, idx) => {
                    Plotly.newPlot(`chart${model}`, [], {
                        //title: {
                        //    text: titles[idx],
                        //    font: { size: 16, color: '#2c3e50' }
                        //},

                        legend: {
                            x: 0.01,         // slight padding from the left
                            y: 0.99,         // slight padding from the top
                            xanchor: 'left',
                            yanchor: 'top',
                            orientation: 'h' // vertical legend
                        },
                        xaxis: {
                            //title: 'Time',
                            showgrid: true,
                            gridcolor: '#f0f0f0'
                        },
                        yaxis: {
                            title: model === 'F' ? 'precio de venta: Mayo26 (USD/t)' : model === 'R' ? 'rendimiento potencial (t/ha)' :  model === 'M' ? 'margen potencial (USD/ha)' : '',
                            showgrid: true,
                            side: 'right',
                            gridcolor: '#f0f0f0'
                        },
                        plot_bgcolor: 'white',
                        paper_bgcolor: 'white',
                        margin: { t: 5, b: 80, l: 50, r: 60 }
                    }, {
                        responsive: true,
                        displayModeBar: false
                    });
                });
            }

            setupEventListeners() {
                document.getElementById('runSimulation').addEventListener('click', () => {

                    
                    document.querySelectorAll(".form-group input").forEach(input => {
                        if (input.value === "" || input.value === null || input.value === undefined) {
                        input.value = 0;
                        }
                    });
                    
                    this.runSimulation();
                });
            }
        }

        // Initialize the simulation when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new StochasticSimulation();
        });

        // Province data from CSV
        const provinceData = {
            "Buenos Aires": { cost: 848, yield: 3.17, stdYield: 0.44 },
            "Cordoba": { cost: 833, yield: 3.04, stdYield: 0.49 },
            "Corrientes": { cost: 745, yield: 2.66, stdYield: 0.47 },
            "Entre Rios": { cost: 800, yield: 2.59, stdYield: 0.53 },
            "La Pampa": { cost: 634, yield: 3.12, stdYield: 0.56 },
            "Salta": { cost: 800, yield: 2.28, stdYield: 0.44 },
            "Santa Fe": { cost: 1067, yield: 3.67, stdYield: 0.5 },
            "Santiago del Estero": { cost: 791, yield: 3.26, stdYield: 0.68 }
        };

        // Set today's date as default
        document.getElementById('sellFwdDate').value = new Date().toISOString().split('T')[0];

        // Update strike prices based on future price (90% default)
        function updateStrikePrices() {
            const futurePrice = parseFloat(document.getElementById('futurePrice').value) || 295;
            const estimatedYield = parseFloat(document.getElementById('estimatedYield').value) || 3.17;
            
            document.getElementById('pricePutStrike').value = (futurePrice * 0.9).toFixed(2);
            document.getElementById('priceCallStrike').value = (futurePrice * 1.1).toFixed(2);
            document.getElementById('yieldPutStrike').value = (estimatedYield * 0.9).toFixed(2);
        }

        // Update defaults when province changes
        function updateDefaults() {
            const selectedProvince = document.getElementById('provincia').value;
            const data = provinceData[selectedProvince];
            
            if (data) {
                document.getElementById('cost').value = data.cost;
                document.getElementById('estimatedYield').value = data.yield;
                document.getElementById('stdYield').value = data.stdYield;
                updateStrikePrices();
            }
        }

        // Update strike prices when future price or yield changes
        document.getElementById('futurePrice').addEventListener('input', updateStrikePrices);
        document.getElementById('estimatedYield').addEventListener('input', updateStrikePrices);

        // Initialize strike prices
        updateStrikePrices();

        // Black-Scholes Option Pricing Functions & Bachelier

        // Standard normal probability density function
        function normalPDF(x) {
            return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        }

        // Standard normal cumulative distribution function
        function normalCDF(x) {
            // Using Abramowitz and Stegun approximation
            const a1 =  0.254829592;
            const a2 = -0.284496736;
            const a3 =  1.421413741;
            const a4 = -1.453152027;
            const a5 =  1.061405429;
            const p  =  0.3275911;
            
            const sign = x < 0 ? -1 : 1;
            x = Math.abs(x) / Math.sqrt(2.0);
            
            const t = 1.0 / (1.0 + p * x);
            const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
            
            return 0.5 * (1.0 + sign * y);
        }

        // Calculate d1 parameter for Black-Scholes
        function calculateD1(S, K, r, T, sigma) {
            return (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        }

        // Calculate d2 parameter for Black-Scholes
        function calculateD2(d1, sigma, T) {
            return d1 - sigma * Math.sqrt(T);
        }

        // Black-Scholes Call Option Price
        function blackScholesCall(S, K, r, T, sigma) {
            /*
            Parameters:
            S - Current stock price
            K - Strike price
            r - Risk-free rate (annual)
            T - Time to expiration (in years)
            sigma - Volatility (annual)
            */
            
            if (T <= 0) return Math.max(S - K, 0); // Intrinsic value at expiration
            if (sigma <= 0) return Math.max(S - K , 0);
            
            const d1 = calculateD1(S, K, r, T, sigma);
            const d2 = calculateD2(d1, sigma, T);
            
            const callPrice = (S * normalCDF(d1) - K  * normalCDF(d2))* Math.exp(-r * T);
            
            return Math.max(callPrice, 0); // Ensure non-negative price
        }

        // Black-Scholes Put Option Price
        function blackScholesPut(S, K, r, T, sigma) {
            /*
            Parameters:
            S - Current stock price
            K - Strike price
            r - Risk-free rate (annual)
            T - Time to expiration (in years)
            sigma - Volatility (annual)
            */
            
            if (T <= 0) return Math.max(K - S, 0); // Intrinsic value at expiration
            if (sigma <= 0) return Math.max(K - S, 0);
            
            const d1 = calculateD1(S, K, r, T, sigma);
            const d2 = calculateD2(d1, sigma, T);
            
            const putPrice = (K  * normalCDF(-d2) - S * normalCDF(-d1))* Math.exp(-r * T);
            
            return Math.max(putPrice, 0); // Ensure non-negative price
        }


        // Bachelier Put Option Price
        function bachelierPut(F, K, r, T, sigma) {
            /*
            Bachelier Model Put Option Pricing
            
            Parameters:
            F - Forward price (or current price for non-dividend paying assets)
            K - Strike price
            r - Risk-free interest rate (annual, as decimal)
            T - Time to expiration (in years)
            sigma - Volatility (annual, absolute volatility, not percentage)
            
            Formula: Put = e^(-rT) * [sigma * sqrt(T) * phi(d) + (K - F) * Phi(d)]
            where d = (K - F) / (sigma * sqrt(T))
            */
            
            // Handle edge cases
            if (T <= 0) {
                return Math.max(K - F, 0); // Intrinsic value at expiration
            }
            
            if (sigma <= 0) {
                // No volatility case
                const discountedIntrinsic = Math.exp(-r * T) * Math.max(K - F, 0);
                return discountedIntrinsic;
            }
            
            // Calculate d parameter
            const sigmaT = sigma * Math.sqrt(T);
            const d = (K - F) / sigmaT;
            
            // Calculate put price using Bachelier formula
            const phi_d = normalPDF(d);
            const Phi_d = normalCDF(d);
            
            const putPrice = Math.exp(-r * T) * (sigmaT * phi_d + (K - F) * Phi_d);
            
            return Math.max(putPrice, 0); // Ensure non-negative price
        }

        function mulberry32(seed) {
            return function() {
                let t = seed += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            };
        }

        function toggleAccordion(element) {
            const header = element.classList.contains('accordion-header') ? element : element.closest('.accordion-content').previousElementSibling;
            const content = header.nextElementSibling;
            
            // Toggle active classes
            header.classList.toggle('active');
            content.classList.toggle('active');
            
            // If opening the accordion, add click listener to content
            if (content.classList.contains('active')) {
                content.addEventListener('click', closeAccordion);
            } else {
                content.removeEventListener('click', closeAccordion);
            }
        }
        
        function closeAccordion(element) {
            // Find the accordion content container
            const content = element.closest('.accordion-content');
            // Find the accordion header (previous sibling of content)
            const header = content.previousElementSibling;
            
            // Remove active classes to close the accordion
            header.classList.remove('active');
            content.classList.remove('active');
        }

        function openAccordion(element) {


            // Find the accordion content container
            const content = element.closest('.accordion').querySelector('.accordion-content');
            // Find the header (the element passed or its previous sibling)
            const header = element.closest('.accordion').querySelector('.accordion-header');
        
            // Add active classes to open the accordion
            header.classList.add('active');
            content.classList.add('active');
        }
        

// Initialize all accordions as closed
document.addEventListener('DOMContentLoaded', function() {
    const allAccordions = document.querySelectorAll('.accordion-header');
    allAccordions.forEach(accordion => {
        accordion.classList.remove('active');
        accordion.nextElementSibling.classList.remove('active');
    });

    const accordion1 = document.getElementById('accordion-precio');
    openAccordion(accordion1);
    
    const accordion2 = document.getElementById('accordion-rinde');
    openAccordion(accordion2);
    
    /*const accordion4 = document.getElementById('accordionExp');
    openAccordion(accordion4);*/

    const accordion3 = document.getElementById('accordion-margen');
    openAccordion(accordion3);
});

document.querySelectorAll(".form-group input").forEach(input => {
    if (input.value === "" || input.value === null || input.value === undefined) {
      input.value = 0;
    }
  });
  
