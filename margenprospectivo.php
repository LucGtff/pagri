<?php
// Load WordPress - file is in same directory as wp-load.php
require_once('wp-load.php');

// Now you have full WordPress functionality
get_header(); 
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análisis de márgen prospectivo</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.26.0/plotly.min.js"></script>
    <!-- Link to the external CSS -->
    <link rel="stylesheet" href="monitoreo_margen.css">
</head>
<body>


    <div class="container">
	
            <h1>Análisis de márgen prospectivo</h1>
            <h2>De la campaña soja 2025/2026 en Argentina (y posiblemente otros cultivos)</h2>
            <br>
            <br>
            <p>Durante la campaña de un cultivo, es dificil anticipar hasta dónde puede llegar el margen, a partir de la proyección de hoy que usa la mejor información posible. El calculo del precio de equilibrio y el rendimiento de indiferencia ayudan a monitorear el riesgo de perdida, siempre con la esperanza de que las cosas no cambien demasiado, aunque para mejor.</p>
            <br>
            <p>Aqui propongamos aquí una perspectiva 'integral' con datos de soja, dejándo moverse precio y rendimiento, y tratando contemplar “todo” lo que podría suceder. Asi se puede comparar el impacto de cualquier posible acción, física, cobertura, o "no hacer nada". La herramienta está destinada únicamente a fines educativos, para el debate y el aprendizaje colaborativo.</p>
            <br>
            <p>Si te interesa seguir el tema, si tenés cualquier duda, o simple darme tu opinión, será mas que bienvenida. <a href="https://api.whatsapp.com/send/?phone=%2B5491170381234&text=hola%20Luc!" target="_blank" rel="noopener noreferrer">contáctame</a> </p>
            
            <br>
            <br>
            
        <div class="two-column">
            <div class="column left">
                <h3 class="column-title">contexto físico y financiero como "visto desde hoy"</h3>
                <div class="form-group">
                    <label for="province">provincia donde se encuentra la hectárea</label>
                    <select id="province" onchange="updateDefaults()">
                        <option value="Buenos Aires">Buenos Aires</option>
                        <option value="Cordoba">Córdoba</option>
                        <option value="Corrientes">Corrientes</option>
                        <option value="Entre Rios">Entre Ríos</option>
                        <option value="La Pampa">La Pampa</option>
                        <option value="Salta">Salta</option>
                        <option value="Santa Fe">Santa Fe</option>
                        <option value="Santiago del Estero">Santiago del Estero</option>
                    </select>
                </div>

                <div class="form-group" title="Si tiene un costo pagado en volumen, puede ajustarlo reduciendo el rendimiento esperado. Ajustará el costo según corresponda. &#10;&#10;Los costos se dedujeron del rendimiento del punto de equilibrio de la página https://www.agbi.com.ar/#/regiones, considerando que el precio de venta era el precio futuro mayo2026.">
                    <label for="cost">costo de producción de soja estimado<span class="unit">(USD/ha)</span></label>
                    <input type="number" id="cost" step="1" value="848">
                </div>

                <div class="form-group" title="Las estimaciones se calculan a partir de los rendimientos históricos del MAGYP (https://datos.gob.ar/ar/dataset/agroindustria-soja---siembra-cosecha-produccion-rendimiento), rendimientos promedio de soja en todas las partes de la provincia en 2023, cuando son superiores a 2500 kg, excepto Salta.">
                    <label for="estimatedYield">rendimiento de soja esperado<span class="unit">(t/ha)</span></label>
                    <input type="number" id="estimatedYield" step="0.01" value="3.17">
                </div>

                <div class="form-group" title="Lo mismo que para el rinde esperado, ahi es la desviación estándar de los últimos 25 años.">
                    <label for="stdYield">desv. est. rendimiento esp.<span class="unit">(t/ha)</span></label>
                    <input type="number" id="stdYield" step="0.01" value="0.44">
                </div>

                <div class="form-group" title="precio Matba Rofex, se puede ajustar si corresponde">
                    <label for="futurePrice">precio del contracto soja Mayo2026<span class="unit">(USD/t)</span></label>
                    <input type="number" id="futurePrice" step="0.5" value="295">
                </div>

                <div class="form-group">
                    <label for="volatilityPrice" title="Este parámetro se deduce de los precios de mercado. Podés dejar 20% como referencia si no sabés el valor exacto.">volatilidad del soja Mayo2026</label>
                    <div class="percentage-input">
                        <input type="number" id="volatilityPrice" step="0.01" value="20" min="0" max="100">
                    </div>
                </div>

                <div class="form-group">
                    
                    <label for="Margen_reserva" title="Este es el margen mínimo requerido para realizar la inversión. Puede ser un valor negativo en caso de aceptar endeudamiento o tener reserva disponible.">margen mínimo requerido<span class="unit">(USD/ha)</span></label>
                    <input type="number" id="Margen_reserva" step="1" value="0">
                </div>


            </div>

            <div class="column right">
                <h3 class="column-title">las acciones y coberturas posibles para proteger y mejorar el margen del hectárea</h3>
               
                <div class="form-row">
					<div class="form-group" title="el porcentaje representa la proporción de soja a cubrir, basado sobre la producción sobre un hectárea, con el rendimiento esperado.">
						<label for="sellingFwdRange">venta un forward</label>
						<div class="percentage-slider">
							<input type="range" id="sellingFwdRange" min="0" max="100" step="25" value="0" oninput="sellingFwdNumber.value = value">
							<output id="sellingFwdNumber">0</output><span class="unit">%</span>
						</div>
					</div>
                    <div class="form-group">
                        <label for="sellFwdDate">a fecha estimada</label>
                        <input type="date" id="sellFwdDate" value="">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group" title="el porcentaje representa la proporción de soja a cubrir, basado sobre la producción sobre un hectárea, con el rendimiento esperado.">
                        <label for="sellingFwdRegularRange">vta forward poco a poco</label>
                        <div class="percentage-slider">
							<input type="range" id="sellingFwdRegularRange" min="0" max="100" step="25" value="0" oninput="sellingFwdRegularNumber.value = value">
							<output id="sellingFwdRegularNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="nbFixing">con tantas fechas de fijación</label>
                        <input type="number" id="nbFixing" value="4" min="1">
                    </div>
                </div>

                <div class="form-row" title="el porcentaje representa la proporción de soja a cubrir, basado sobre la producción sobre un hectárea, con el rendimiento esperado.">
                    <div class="form-group">
                        <label for="buyingPricePutRange">cmp un put de precio</label>
                        <div class="percentage-slider">
							<input type="range" id="buyingPricePutRange" min="0" max="100" step="25" value="0" oninput="buyingPricePutNumber.value = value">
							<output id="buyingPricePutNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="pricePutStrike">con un piso de<span class="unit">(USD/t)</span></label>
                        <input type="number" id="pricePutStrike" step="0.1" value="265.5">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group" title="el porcentaje representa la proporción de soja a cubrir, basado sobre la producción sobre un hectárea, con el rendimiento esperado.">
                        <label for="sellPriceCallRange">vta un call de precio</label>
                        <div class="percentage-slider">
							<input type="range" id="sellPriceCallRange" min="0" max="100" step="25" value="0" oninput="sellPriceCallNumber.value = value">
							<output id="sellPriceCallNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="priceCallStrike">con un techo de<span class="unit">(USD/t)</span></label>
                        <input type="number" id="priceCallStrike" step="0.1" value="265.5">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group" title="el porcentaje representa la proporción de soja a cubrir, basado sobre la producción sobre un hectárea, con el rendimiento esperado.">
                        <label for="buyYieldPutRange">cmp un seguro de rinde</label>
                        <div class="percentage-slider">
							<input type="range" id="buyYieldPutRange" min="0" max="100" step="25" value="0" oninput="buyYieldPutNumber.value = value">
							<output id="buyYieldPutNumber">0</output><span class="unit">%</span>                        </div>
                    </div>
                    <div class="form-group">
                        <label for="yieldPutStrike">piso de rinde<span class="unit">(t/ha)</span></label>
                        <input type="number" id="yieldPutStrike" step="0.01" value="2.45">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group" title="/!\\ no existe este producto todavia me parece /!\\. el porcentaje representa la proporción de soja a cubrir, basado sobre la producción sobre un hectárea, con el rendimiento esperado.">
                        <label for="buyMarginPutRange">cmp un seguro de margen</label>
                        <div class="percentage-slider">
							<input type="range" id="buyMarginPutRange" min="0" max="100" step="25" value="0" oninput="buyMarginPutNumber.value = value">
							<output id="buyMarginPutNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="marginPutStrike">piso de margen<span class="unit">(USD/ha)</span></label>
                        <input type="number" id="marginPutStrike" step="1" value="0">
                    </div>
                </div>


                <div class="form-row">
                    <div class="form-group" title="Es una diferencia porcentual. Un '-30' significa una reducción del 30 % en el parámetro observado, le queda el 70%.">
                        <label for="diversificationYieldRange">corrección en el rinde</label>
                        <div class="percentage-slider">
							<input type="range" id="diversificationYieldRange" min="-100" max="100" step="10" value="0" oninput="diversificationYieldNumber.value = value">
							<output id="diversificationYieldNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>
                    <div class="form-group" title="Es una diferencia porcentual. Un '-30' significa una reducción del 30 % en el parámetro observado, le queda el 70%.">
                        <label for="diversificationStdYieldRange">corr. desv. est. del rinde</label>
                        <div class="percentage-slider">
							<input type="range" id="diversificationStdYieldRange" min="-100" max="100" step="10" value="0" oninput="diversificationStdYieldNumber.value = value">
							<output id="diversificationStdYieldNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>

                </div>

                <div class="form-row">

                    <div class="form-group" title="Es una diferencia porcentual. Un '-30' significa una reducción del 30 % en el parámetro observado, le queda el 70%.">
                        <label for="diversificationCostoRange">corrección en el costo</label>
                        <div class="percentage-slider">
							<input type="range" id="diversificationCostoRange" min="-100" max="100" step="10" value="0" oninput="diversificationCostoNumber.value = value">
							<output id="diversificationCostoNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>


                    <div class="form-group" title="Es una diferencia porcentual. Un '-30' significa una reducción del 30 % en el parámetro observado, le queda el 70%.">
                        <label for="corr_precioRange">corr. en el precio de venta</label>
                        <div class="percentage-slider">
							<input type="range" id="corr_precioRange" min="-100" max="100" step="10" value="0" oninput="corr_precioNumber.value = value">
							<output id="corr_precioNumber">0</output><span class="unit">%</span>
                        </div>
                    </div>

                </div>
            </div>
                    

        </div>


        <div class="accordion">
		<div class="accordion-header no-border" onclick="toggleAccordion(this)">
                <h3 class="accordion-title right-aligned" >(algunos parámetros de visualización opcional y algunos comentarios)</h3>
                <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content" ondblclick="closeAccordion(this)">
                <div class="two-column">
                    <div class="column left">
                        <div class="column">
                            <h3 class="column-title">parámetros de visualización y comentarios</h3>
                            <div class="form-group">
                                <label for="ctiSce">cantidad de escenarios</label>
                                <input type="number" id="ctiSce" step="1" value="3" min="0" max="100">
                            </div>
    
                            <div class="form-group">
                                <label for="fijarAlea">fijar alea</label>
                                <input type="checkbox" id="fijarAlea">
                            </div>
                            <br><br>
                            <div class="commentary-section">
                                <ul class="commentary-list">
                                 <li>La modelización de la incertidumbre de precios y rendimientos utiliza modelos clásicos: Black-Scholes y Bachelier. Son modelos "simples" que utilizan poca información y son representativos de "mucho" de lo que podría suceder, como puedes juzgar. Cisnes negros, no, eso es seguro. Cualquier conclusión se debe hacer con cautela de todo modo.</li>
                                 <li>Sin embargo, sería posible mejorarlos con alguna consideración apropiada, intuicion propia, o incorporar otros modelos en una versión futura.</li>
                                 
                                </ul>
                              </div>

                        </div>
                    </div>
    
                    <div class="column right">
                        <div class="column">
                            <h3 class="column-title">algunos comentarios más</h3>
                            
                            <div class="commentary-section">
                                <ul class="commentary-list">
                                    <li>El ejercicio es teórico, no hay preocupaciones legales ni administrativas (comprimiso de entrega, margen de garantia, etc.)</li>
                                    <li>El precio de las opciones es aproximado, pero lo suficientemente representativo como para darle una idea. En particular, las opciones de rentabilidad garantizada y margen son productos complejos.</li>
                                 
                                    <li>La herramienta está diseñada soja, pero puedes adaptarla para otro cultivo ingresando los costos asociados, rendimiento y precio.</li>
                                    <li>La herramienta está diseñada en USD, una versión futura podría tener en cuenta el riesgo cambiario sin problema.</li>
                                  
                                  <li>Esta herramienta no constituye asesoramiento financiero o commercial. Su propósito es ayudar a comprender mejor los riesgos precio y rendimiento en el margen, así como el posible impacto de diferentes estrategias de cobertura.</li>
                                  <li>Para tomar decisiones financieras concretas o definir una estrategia de cobertura, se recomienda consultar con su asesor profesional de confianza.</li>
                                
                                </ul>
                              </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>    
        
        

        <div class="accordion" id="accordionExp">
            <div class="accordion-header no-border" onclick="toggleAccordion(this)">
                    <h3 class="accordion-title right-aligned" >algunas explicaciones de lo que estamos haciendo</h3>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content" ondblclick="closeAccordion(this)">

            <div style="text-align: left;">
                <p>No vamos a hacer ninguna suposición sobre el precio o el rendimiento futuro. Consideraremos 'todas' las posibles trajectorias de precios y rendimientos que podrian occurir con tal nivel de volatilidad, desde la proyección de hoy, y hasta la cosecha de mayo de 2026. A cada momento y en cada posibilidad, deducemos el margen asociado, y incorporamos el impacto de las acciones y las coberturas.</p>
                <br>
                <p style="font-size: 16px; font-family: sans-serif;">
                    <strong>margen</strong> = (precio de venta {posiblemente "mejorado"} × rendimiento {posiblemente "mejorado"}) – costo de producción {posiblemente "mejorado"}
                  </p>
                  <br>
                <p title="(*) Podemos cuestionar si 'todo' está bien representado. Estos modelos 'simples', si bien calibrados pueden proporcionar una estimación muy razonable de este 'todo', salvo los cisnes negros!, que puede verificarse en los gráficos de precio y rendimiento. Estos modelos pueden mejorarse tambien si confiamos en ciertos modelos de predicción o si deseamos incorporar nuestras propias intuiciones.">¿Qué podemos deducir? Obtenemos intervalos de 'todo'(*) lo que podría ocurrir (con la "chance" de que esto pase). Es un resultado "difuso", pero al menos permite tener una idea de si las cosas van mal, hasta dónde llegarán y, de igual manera, si van bien. Podemos comparar y entender tambien el impacto de cada accion o cobertura, frente a este 'todo' (*).<strong> Se trata de una visión prospectiva e 'integral' de los riesgos.</strong></p>
                  <br>
                </div>

            </div>
        </div>
    </div> 

        <div class="controls">
          <div style="text-align: center;">
                <button id="runSimulation" class="simulation-button">
                    Vamos!
                </button>
                <div id="progressContainer" class="progress-container">
                    <div class="progress-text" id="progressText">initializacion...</div>
                    <div class="progress-bar" id="progressBar"></div>
                </div>
            </div>
        </div>

        <!-- <h2 class="section-title">Una vista amplia de las evoluciónes posibles del precio futuro, el rendimiento y el margen resultante</h2> -->

        <!-- Accordion 1: Price Charts -->
        <div class="accordion" id="accordion-precio">
            <div class="accordion-header" onclick="toggleAccordion(this)">
                <h3 class="accordion-title">Hasta dónde podria llegar el precio de venta</h3>
                <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content" ondblclick="closeAccordion(this)">
                <div class="two-column">
                    <div class="column">
                        <h3 class="column-title">Hasta dónde podria llegar el precio 'puro'</h3>
                        <div id="chartF" class="chart-panel"></div>
                    </div>
                    <div class="column">
                        <h3 class="column-title">Hasta dónde podria llegar el precio 'mejorado'</h3>
                        <div id="chartFH" class="chart-panel"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Accordion 2: Yield Charts -->
        <div class="accordion" id="accordion-rinde">
            <div class="accordion-header" onclick="toggleAccordion(this)">
                <h3 class="accordion-title">Hasta dónde podria llegar el rendimiento</h3>
                <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content" ondblclick="closeAccordion(this)">
                <div class="two-column">
                    <div class="column">
                        <h3 class="column-title">Hasta dónde podria llegar el rendimiento puro</h3>
                        <div id="chartR" class="chart-panel"></div>
                    </div>
                    <div class="column">
                        <h3 class="column-title">Hasta dónde podria llegar el rendimiento mejorado</h3>
                        <div id="chartRH" class="chart-panel"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Accordion 3: Margin Charts -->
        <div class="accordion" id="accordion-margen">
            <div class="accordion-header" onclick="toggleAccordion(this)">
                <h3 class="accordion-title">eHasta dónde podria llegar el margen</h3>
                <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content" ondblclick="closeAccordion(this)">
                <div class="two-column">
                    <div class="column">
                        <h3 class="column-title">Hasta dónde podria llegar el margen puro</h3>
                        <div id="chartM" class="chart-panel"></div>
                    </div>
                    <div class="column">
                        <h3 class="column-title">Hasta dónde podria llegar el margen mejorado</h3>
                        <div id="chartMH" class="chart-panel"></div>
                    </div>
                </div>
            </div>
        </div>
        

    </div>



  <!-- Link to the external JS (placed before closing </body>) -->
  <script src="mp.js"></script>
</body>
