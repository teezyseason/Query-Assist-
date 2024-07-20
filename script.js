const instructionsBtn = document.getElementById("instructions"); 
const instructionsModal = document.querySelector(".instructions-modal"); 
const InstructionsCloseBtn = document.getElementById("instructionsCloseBtn");

//Display popup modal with detailed intsructions
instructionsBtn.addEventListener("click", async ()=>{
    instructionsModal.style.display = 'flex'; 
    }); 
    InstructionsCloseBtn.addEventListener("click", ()=>{
        instructionsModal.style.display = 'none'
    });
    

    document.getElementById('generate-button').addEventListener('click', async () => {
        try {
            const htmlCode = document.getElementById('html-code').value.trim();
            const cssCode = document.getElementById('css-code').value.trim();
            const breakpointsInput = document.getElementById('breakpoints').value.trim();

            if (!htmlCode) {
                throw new Error('HTML code is required.');
            }
            if (!cssCode) {
                throw new Error('CSS code is required.');
            }

            // Parse user-specified breakpoints
            let breakpoints = breakpointsInput.split(',').map(bp => parseInt(bp.trim())).filter(bp => !isNaN(bp));
            if (breakpoints.length === 0) {
                breakpoints = analyzeHTMLContent(htmlCode); // Fallback to dynamic breakpoints if none specified
            }

            console.log("Breakpoints:", breakpoints);
            const mediaQueries = await generateMediaQueries(cssCode, breakpoints);

            document.getElementById('generated-queries').textContent = mediaQueries;
            document.getElementById('error-message').style.display = 'none';
            document.getElementById('modal').style.display = "block";

        } catch (error) {
            document.getElementById('error-message').textContent = `Error: ${error.message}`;
            document.getElementById('error-message').style.display = 'block';
            console.error(error);
        }
    });

    document.querySelector('.close-button').addEventListener('click', () => {
        document.getElementById('modal').style.display = "none";
    });

    function analyzeHTMLContent(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const elements = tempDiv.querySelectorAll('*');
        const dimensions = new Set();

        elements.forEach(el => {
            const computedStyles = window.getComputedStyle(el);
            const width = el.getBoundingClientRect().width;
            const height = el.getBoundingClientRect().height;
            const padding = parseFloat(computedStyles.getPropertyValue('padding-left')) + parseFloat(computedStyles.getPropertyValue('padding-right'));
            const margin = parseFloat(computedStyles.getPropertyValue('margin-left')) + parseFloat(computedStyles.getPropertyValue('margin-right'));
            const fontSize = parseFloat(computedStyles.getPropertyValue('font-size'));

            if (width > 0) dimensions.add(width);
            if (height > 0) dimensions.add(height);
            if (padding > 0) dimensions.add(padding);
            if (margin > 0) dimensions.add(margin);
            if (fontSize > 0) dimensions.add(fontSize);
        });

        return [...dimensions].sort((a, b) => a - b);
    }

    async function generateMediaQueries(css, breakpoints) {
        let mediaQueries = '';

        try {
            const root = postcss.parse(css);

            breakpoints.forEach(breakpoint => {
                let mediaQuery = `@media (max-width: ${breakpoint}px) {\n`;

                root.walkRules(rule => {
                    mediaQuery += `  ${rule.selector} {\n`;
                    rule.walkDecls(decl => {
                        // Add conditions for each property
                        if (['width', 'height', 'padding', 'margin', 'font-size'].includes(decl.prop)) {
                            mediaQuery += `    ${decl.prop}: ${decl.value};\n`;
                        }
                    });
                    mediaQuery += `  }\n`;
                });

                mediaQuery += '}\n';
                mediaQueries += mediaQuery;
            });

        } catch (error) {
            throw new Error(`Invalid CSS input or parsing error: ${error.message}`);
        }

        return mediaQueries;
    }