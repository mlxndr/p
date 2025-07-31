document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load the index.html to extract title and metadata
        const indexResponse = await fetch('./index.html');
        const indexHTML = await indexResponse.text();
        
        // Create a temporary element to parse the HTML
        const indexParser = new DOMParser();
        const indexDoc = indexParser.parseFromString(indexHTML, 'text/html');
        
        // Extract the title
        const titleElement = indexDoc.querySelector('.pres-title');
        const subtitleElement = indexDoc.querySelector('.titlebr');
        
        if (titleElement && subtitleElement) {
            const headerHTML = `
                <h1 class="title">${titleElement.textContent.trim()}</h1>
                <div class="subtitle">${subtitleElement.innerHTML.trim()}</div>
            `;
            document.getElementById('handout-header').innerHTML = headerHTML;
        }
        
        // Load and parse content.md
        const mdResponse = await fetch('./content.md');
        const mdContent = await mdResponse.text();
        
        // Process the markdown content
        // Split into sections (separated by ---)
        const sections = mdContent.split(/\n---\n/);
        
        // Also handle sections that start with --- (at beginning of file)
        const allSections = [];
        sections.forEach(section => {
            if (section.startsWith('---\n')) {
                allSections.push(section.substring(4)); // Remove the leading ---\n
            } else {
                allSections.push(section);
            }
        });
        
        // Filter out empty sections
        const nonEmptySections = allSections.filter(section => section.trim().length > 0);
        
        let contentHTML = '';
        
        // Helper function to process text formatting and links
        function processInlineMarkdown(text) {
            let processed = text;
            
            // Process links [text](url)
            processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, function(match, p1, p2) {
                return `<a href="${p2}">${p1}</a>`;
            });
            
            // Process italics with *
            processed = processed.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
            
            // Process bold with **
            processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            
            // Process inline code with `
            processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            return processed;
        }
        
        // Process content by section
        nonEmptySections.forEach((section, sectionIndex) => {
            // Split each section into subsections (separated by --)
            const subsections = section.split(/\n--\n/);
            
            subsections.forEach((subsection, subsectionIndex) => {
                // Start a new section div
                contentHTML += '<div class="section">';
                
                // Process content line by line
                let lines = subsection.trim().split('\n');
                let i = 0;
                let safety = 0; // Safety counter to prevent infinite loops
                const MAX_ITERATIONS = lines.length * 10;
                
                while (i < lines.length && safety < MAX_ITERATIONS) {
                    safety++;
                    let line = lines[i];
                    
                    // Handle headings
                    if (line.startsWith('## ')) {
                        contentHTML += `<h2>${processInlineMarkdown(line.substring(3))}</h2>`;
                        i++;
                        continue;
                    }
                    
                    if (line.startsWith('### ')) {
                        contentHTML += `<h3>${processInlineMarkdown(line.substring(4))}</h3>`;
                        i++;
                        continue;
                    }
                    
                    // Handle images
                    if (line.startsWith('![')) {
                        const altTextMatch = line.match(/!\[(.*?)\]/);
                        const altText = altTextMatch ? altTextMatch[1] : '';
                        
                        const srcMatch = line.match(/\((.*?)\)/);
                        const src = srcMatch ? srcMatch[1] : '';
                        
                        if (src) {
                            contentHTML += `<img src="${src}" alt="${altText}" />`;
                        }
                        i++;
                        continue;
                    }
                    
                    // Skip HTML comments
                    if (line.trim().startsWith('<!--')) {
                        i++;
                        // Skip until we find the end of the comment
                        while (i < lines.length && !lines[i].includes('-->')) {
                            i++;
                        }
                        if (i < lines.length) i++; // Skip the line with -->
                        continue;
                    }
                    
                    // Handle unordered lists
                    if (line.trim().startsWith('* ')) {
                        let listHTML = '<ul>';
                        let currentIndentLevel = line.indexOf('*'); // Track the current indent level
                        
                        // Process this list item
                        listHTML += `<li>${processInlineMarkdown(line.substring(line.indexOf('*') + 1).trim())}`;
                        
                        // Look for more list items
                        let nestedList = false;
                        let nestedListContent = '';
                        
                        i++;
                        let listSafety = 0;
                        while (i < lines.length && listSafety < 1000) {
                            listSafety++;
                            const nextLine = lines[i];
                            
                            // Not a list item anymore, so break out
                            if (!nextLine.trim().startsWith('* ')) {
                                // Close nested list if we had one
                                if (nestedList) {
                                    nestedListContent += '</ul>';
                                    listHTML += nestedListContent;
                                }
                                break;
                            }
                            
                            const nextIndentLevel = nextLine.indexOf('*');
                            
                            // If it's more indented (nested list item)
                            if (nextIndentLevel > currentIndentLevel) {
                                if (!nestedList) {
                                    nestedList = true;
                                    nestedListContent = '<ul>';
                                }
                                
                                nestedListContent += `<li>${processInlineMarkdown(nextLine.substring(nextLine.indexOf('*') + 1).trim())}</li>`;
                                i++;
                                continue;
                            }
                            
                            // Same level as original list
                            if (nextIndentLevel === currentIndentLevel) {
                                // Close nested list if we had one
                                if (nestedList) {
                                    nestedListContent += '</ul>';
                                    listHTML += nestedListContent;
                                    nestedList = false;
                                    nestedListContent = '';
                                }
                                
                                // Close previous item and start new one
                                listHTML += '</li>';
                                listHTML += `<li>${processInlineMarkdown(nextLine.substring(nextLine.indexOf('*') + 1).trim())}`;
                                i++;
                                continue;
                            }
                            
                            // Less indented - this means we're back to a higher level list
                            // End this list completely
                            if (nextIndentLevel < currentIndentLevel) {
                                // Close nested list if we had one
                                if (nestedList) {
                                    nestedListContent += '</ul>';
                                    listHTML += nestedListContent;
                                }
                                break;
                            }
                        }
                        
                        // IMPORTANT: If we still have an open nested list when we exit the loop, close it!
                        if (nestedList) {
                            nestedListContent += '</ul>';
                            listHTML += nestedListContent;
                        }
                        
                        // Close the last list item and the list
                        listHTML += '</li></ul>';
                        contentHTML += listHTML;
                        continue;
                    }
                    
                    // Handle ordered lists (similar pattern as unordered)
                    if (line.match(/^\d+\.\s/)) {
                        let listHTML = '<ol>';
                        
                        // Process this list item
                        listHTML += `<li>${processInlineMarkdown(line.replace(/^\d+\.\s/, '').trim())}`;
                        
                        // Look for indented list items
                        let nestedList = false;
                        let nestedListContent = '';
                        
                        i++;
                        let listSafety = 0;
                        while (i < lines.length && listSafety < 1000) {
                            listSafety++;
                            const nextLine = lines[i];
                            
                            // If indented list item
                            if (nextLine.match(/^\s+\d+\.\s/)) {
                                if (!nestedList) {
                                    nestedList = true;
                                    nestedListContent = '<ol>';
                                }
                                
                                nestedListContent += `<li>${processInlineMarkdown(nextLine.replace(/^\s+\d+\.\s/, '').trim())}</li>`;
                                i++;
                                continue;
                            }
                            
                            // Still in main list
                            if (nextLine.match(/^\d+\.\s/) && !nextLine.match(/^\s+\d+\.\s/)) {
                                // Close nested list if we had one
                                if (nestedList) {
                                    nestedListContent += '</ol>';
                                    listHTML += nestedListContent;
                                    nestedList = false;
                                }
                                
                                // Close previous item and start new one
                                listHTML += '</li>';
                                listHTML += `<li>${processInlineMarkdown(nextLine.replace(/^\d+\.\s/, '').trim())}`;
                                i++;
                                continue;
                            }
                            
                            // Not a list item anymore
                            if (!nextLine.match(/^\d+\.\s/)) {
                                // Close nested list if we had one
                                if (nestedList) {
                                    nestedListContent += '</ol>';
                                    listHTML += nestedListContent;
                                }
                                break;
                            }
                        }
                        
                        // Close the last list item and the list
                        listHTML += '</li></ol>';
                        contentHTML += listHTML;
                        continue;
                    }
                    
                    // Handle empty lines as paragraph breaks
                    if (line.trim() === '') {
                        i++;
                        continue;
                    }
                    
                    // Regular paragraph text
                    contentHTML += `<p>${processInlineMarkdown(line)}</p>`;
                    i++;
                }
                
                // Close the section
                contentHTML += '</div>';
            });
        });
        
        document.getElementById('handout-content').innerHTML = contentHTML;
        
    } catch (error) {
        console.error('Error loading content:', error);
        document.getElementById('handout-content').innerHTML = `<p>Error loading content: ${error.message}</p>`;
    }
});