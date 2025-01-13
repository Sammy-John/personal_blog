const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Paths to the files
const postsDir = path.join(__dirname, 'posts');
const outputDir = path.join(__dirname, 'output');
const jsonPath = path.join(outputDir, 'posts.json');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

function parseMetadata(content) {
    const metadata = {};
    const metadataStart = content.indexOf('---');
    const metadataEnd = content.indexOf('---', metadataStart + 3);

    if (metadataStart !== -1 && metadataEnd !== -1) {
        const metadataContent = content.slice(metadataStart + 3, metadataEnd).trim();
        const lines = metadataContent.split('\n').filter(Boolean);
        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                metadata[key.trim()] = valueParts.join(':').trim().replace(/^"(.*)"$/, '$1'); // Strip extra quotes
            }
        });
    }
    return metadata;
}

// Configure global marked options
marked.setOptions({
    gfm: true,        // Enable GitHub Flavored Markdown
    breaks: true,     // Convert line breaks to <br>
    smartLists: true, // Use smarter list formatting
    smartypants: true // Convert quotes and dashes to typographic equivalents
});

const renderer = {
    paragraph(text) {
        if (typeof text !== "string") {
            // Convert objects to a string if necessary
            text = text.text || JSON.stringify(text);
        }

        // Handle epigraphs
        if (text.startsWith(":::epigraph")) {
            const content = text.replace(":::epigraph", "").replace(":::", "").trim();
            // Pass the content through `marked` to process inline Markdown like `**bold**`
            return `<div class="epigraph">${marked.parseInline(content)}</div>`;
        }

        // Handle epitaphs
        if (text.startsWith(":::epitaph")) {
            const content = text.replace(":::epitaph", "").replace(":::", "").trim();
            // Pass the content through `marked` to process inline Markdown like `**bold**`
            return `<div class="epitaph">${marked.parseInline(content)}</div>`;
        }

        // Default paragraph rendering (let `marked` handle inline Markdown)
        return `<p>${marked.parseInline(text)}</p>`;
    },
};

// Apply the custom renderer
marked.use({ renderer });



// Updated generatePostHTML function
function generatePostHTML(post, markdownContent) {
    const metadataPattern = /---[\s\S]*?---/;
    const markdownWithoutMetadata = markdownContent.replace(metadataPattern, '').trim();
    const htmlContent = marked(markdownWithoutMetadata);

    // Generate the Table of Contents and updated HTML content with IDs
    const { toc, updatedContent } = generateAsideNavigation(htmlContent);

    // Define the Open Graph and Twitter meta tags
    const ogMetaTags = `
        <meta property="og:title" content="${post.title}" />
        <meta property="og:description" content="${post.summary}" />
        <meta property="og:image" content="https://sammyjohnrawlinson.teknabu.com/blog/${post.image}" />
        <meta property="og:url" content="https://sammyjohnrawlinson.teknabu.com/blog/${post.file}" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${post.title}" />
        <meta name="twitter:description" content="${post.summary}" />
        <meta name="twitter:image" content="https://sammyjohnrawlinson.teknabu.com/blog/${post.image}" />
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${post.title}</title>
            <link rel="stylesheet" href="../styles.css">
            ${ogMetaTags}
        </head>
        <body>
            <div class="container">
                <header id="main-header" class="header">
                    <h1 id="site-title">Sammy John Rawlinson</h1>
                    <nav>
                        <div class="burger-menu" aria-expanded="false" role="button" tabindex="0">☰</div>
                        <ul id="nav-links">
                            <li><a href="https://sammyjohnrawlinson.teknabu.com/blog/index.html#about">About</a></li>
                            <li><a href="https://sammyjohnrawlinson.teknabu.com/blog/index.html#blog-list">Blog Posts</a></li>
                            <li><a href="https://sammyjohnrawlinson.teknabu.com/blog/index.html#contact">Contact</a></li>
                            <li><a href="https://sammyjohnrawlinson.teknabu.com/cv">Resume</a></li>
                            <li><a href="index.html#portfolio">Portfolio</a></li>
                        </ul>
                    </nav>
                </header>
                <nav class="breadcrumbs">
                    <a href="../">Blog</a> &gt; ${post.title}
                </nav>
                <main>
                    <article>
                        <header>
                            <h1>${post.title}</h1>
                            <p>${post.date}</p>
                            <img src="../${post.image}" alt="${post.title}" loading="lazy">
                        </header>
                        <aside class="toc">
                            <h2>Table of Contents</h2>
                            ${toc} <!-- Table of Contents -->
                        </aside>
                        ${updatedContent} <!-- Main blog post content -->
                    </article>
                </main>
                <footer class="site-footer">
                    <div class="footer-left">
                        <h4>Contact</h4>
                        <a href="mailto:sjr.dev@protonmail.com" class="email-link" aria-label="Send an email to Sammy John Rawlinson at sjr.dev@protonmail.com">
                            <i class="fas fa-envelope"></i> sjr.dev@protonmail.com
                        </a>
                    </div>
                    <div class="footer-right">
                        <h4>Follow</h4>
                        <div class="social-links">
                            <a href="https://x.com/nabu_tech" target="_blank" aria-label="Follow us on Twitter">
                                <i class="fab fa-twitter"></i> Twitter
                            </a>
                            <a href="https://www.linkedin.com/in/sammyjohnrawlinson/" target="_blank" aria-label="Follow us on LinkedIn">
                                <i class="fab fa-linkedin"></i> LinkedIn
                            </a>
                            <a href="https://github.com/Sammy-John" target="_blank" aria-label="Follow us on GitHub">
                                <i class="fab fa-github"></i> GitHub
                            </a>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <div class="footer-address">
                            <p>&copy; 2024</p>
                            <div class="logo-container">
                                <div class="logo-static" aria-hidden="true"></div>
                                <p class="logo-text-static">
                                    <span>e</span><span>k</span><span>N</span><span>a</span><span>b</span><span>u</span>
                                </p>
                            </div>
                            <p>All Rights Reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
            <script src="../scripts.js"></script>
        </body>
        </html>
    `;
}



// Function to generate the aside navigation based on headings in the post
const cheerio = require('cheerio');

function generateAsideNavigation(htmlContent) {
    const $ = cheerio.load(htmlContent, { xmlMode: false }); // Disable XML mode for plain HTML
    const headings = $('h2, h3'); // Select headings for ToC
    let toc = '<ul>'; // Initialize ToC HTML

    headings.each((index, heading) => {
        const id = `heading-${index}`; // Generate unique ID
        $(heading).attr('id', id); // Add the ID to the heading
        toc += `<li><a href="#${id}">${$(heading).text()}</a></li>`; // Add link to ToC
    });

    toc += '</ul>';
    return { toc, updatedContent: $('body').html() || '' }; // Return cleaned HTML
}



// Function to generate the homepage HTML
function generateHomepageHTML(posts) {
    const latestPost = posts[0];
    const featuredImage = latestPost.image || "./calabim400x400.png"; // Use a fallback image
    
    let postsList = posts.slice(1).map(post => {
        return `
            <article class="blog-post">
                <div class="post-header">
                    <a href="${post.file}">${post.title}</a>
                </div>
                <button class="toggle-details">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <p class="post-date">Published on ${post.date}</p>
                <div class="post-details">
                    <div class="post-image">
                        <img src="${post.image || '/images/default-image.webp'}" alt="Blog Post Image">
                    </div>
                    <div class="post-text">
                        <p>${post.summary}</p>
                    </div>
                </div>
            </article>

        `;
    }).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Discover insights and stories about software development, coding, and tech experiences from Sammy John Rawlinson.">
    <meta name="keywords" content="Sammy John Rawlinson, software development, coding, web development, personal development, tech blog">
    <meta name="author" content="Sammy John Rawlinson">
    <title>Sammy John Rawlinson - Blog</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css"> <!-- Link to styles.css -->
    <link rel="canonical" href="https://sammyjohnrawlinson.teknabu.com/blog">
    <meta property="og:title" content="Sammy John Rawlinson - Software Development Blog" >
    <meta property="og:description" content="Insights on software development, coding, and personal growth in tech." >
    <meta property="og:image" content="https://sammyjohnrawlinson.teknabu.com/blog/images/blog.webp" >
    <meta property="og:url" content="https://sammyjohnrawlinson.teknabu.com/blog" >
    <meta property="og:type" content="website" >
    <meta name="twitter:card" content="summary_large_image" >
    <meta name="twitter:title" content="Sammy John Rawlinson - Software Development Blog" >
    <meta name="twitter:description" content="Insights on software development, coding, and personal growth in tech." >
    <meta name="twitter:image" content="https://sammyjohnrawlinson.teknabu.com/blohg/images/blog.webp" >
    <script type="application/ld+json">
    {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Sammy John Rawlinson",
    "url": "https://sammyjohnrawlinson.teknabu.com/",
    "sameAs": [
        "https://x.com/nabu_tech",
        "https://www.linkedin.com/in/sammyjohnrawlinson/",
        "https://github.com/Sammy-John"
    ],
    "jobTitle": "Full-stack Developer",
    "worksFor": {
        "@type": "Organization",
        "name": "Teknabu"
    }
    }
    </script>
    <link rel="preload" href="images/neonbackground.webp" as="image">
    <link rel="preload" href="images/me.jpg" as="image">
    <link rel="icon" href="https://sammyjohnrawlinson.teknabu.com/blog/images/favicon/favicon.ico">

</head>            
<body>
    <main>
        <div class="container">
            <header id="main-header" class="header">
                <h1 id="site-title">Sammy John Rawlinson</h1>
                <nav>
                    <div class="burger-menu" aria-expanded="false" role="button" tabindex="0">☰</div>
                        <ul id="nav-links">
                            <li><a href="#about">About</a></li>
                            <li><a href="#blog-list">Blog Posts</a></li>
                            <li><a href="#contact">Contact</a></li>
                            <li><a href="https://sammyjohnrawlinson.teknabu.com/cv">Resume</a></li>
                            <li><a href="#portfolio">Portfolio</a></li>
                        </ul>
                </nav>
            </header>

             <section class="hero">
                <!-- Featured Post -->
                <div class="featured-post">
                    <img src="${featuredImage}" alt="Featured Blog Post: ${latestPost.title}" loading="lazy">
                    <div class="post-description">
                        <h3>${latestPost.title}</h3>
                    </div>
                </div>


                <!-- Latest Post -->
                <div class="posts-left">
                    <h2>Latest Post</h2>
                    <a href="${latestPost.file.replace('.md', '.html')}" class="post-title">${latestPost.title}</a>
                    <p class="post-date">Published on ${latestPost.date}</p>
                    <p class="post-text">${latestPost.summary}</p>
                </div>

                <!-- About Section -->
                <div class="about" id="about">
                    <div class="profile-image">
                        <img src="images/me.jpg" alt="Sammy John Rawlinsons Profile Picture" loading="lazy">
                    </div>
                    <div class="about-text">
                        <p>Hi, I'm Sammy John Rawlinson, a full-stack developer passionate about crafting digital experiences and sharing insights from my IT journey.</p>
                        <br>
                        <p>In 2021, after a successful career in hospitality, I pivoted to tech during the pandemic, pursuing a Diploma and later a Bachelor's in Software and Web Development. Now, I'm eager to bring my skills to an internship or role while continuing to share my journey and accomplishments.</p>
                        <br>
                        <p>Through <a href="https://teknabu.com" target="_blank" rel="noopener noreferrer">Teknabu</a>, I aim to inspire and support others in tech by sharing knowledge, experiences, and innovations. Together, let's create, learn, and grow.</p>
                        <div class="social-icons">
                            <a href="https://x.com/nabu_tech" target="_blank" aria-label="Follow Sammy John Rawlinson on Twitter"><i class="fab fa-twitter"></i></a>
                            <a href="https://www.linkedin.com/in/sammyjohnrawlinson/" target="_blank" aria-label="Follow Sammy John Rawlinson on Linkedin"><i class="fab fa-linkedin"></i></a>
                            <a href="https://github.com/Sammy-John" target="_blank" aria-label="Follow Sammy John Rawlinson on Github"><i class="fab fa-github"></i></a>
                        </div>
                    </div>
                </div>

                <!-- Subscribe Section 
                <div class="subscribe-right">
                    <h3>Subscribe to Our Newsletter</h3>
                    <form class="subscribe-form">
                        <input type="email" placeholder="Enter your email" required>
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
                -->
                <div class="subscribe-right" id="contact">
                    <h3>Contact Me</h3>
                    <a href="mailto:sjr.dev@protonmail.com"  class="email-link" aria-label="Send an email to Sammy John Rawlinson at sjr.dev@protonmail.com">
                        <i class="fas fa-envelope"></i> sjr.dev@protonmail.com
                    </a>
                </div>
            </section>
            <section class="blog-list-filter" id="blog-list">
                <div class="blog-list-left">
                    <h2>List of Blog Posts</h2>
                        ${postsList}
                    </div>
                <!-- Filter Section
                <div class="filter-right">
                    <h3>Filter by Date</h3>
                        <ul class="year-list">
                            <li>
                                <button class="year-toggle">2024 <i class="fas fa-chevron-down"></i></button>
                                <ul class="month-list">
                                    <li>October</li>
                                    <li>September</li>
                                    <li>August</li>
                                </ul>
                            </li>
                            <li>
                                <button class="year-toggle">2023 <i class="fas fa-chevron-down"></i></button>
                                <ul class="month-list">
                                    <li>December</li>
                                    <li>November</li>
                                    <li>October</li>
                                </ul>
                        </li>
                        </ul>
                    </div>
                    -->
            </section>
            <footer class="site-footer">
                    <div class="footer-left">
                        <h4>Contact</h4>
                    <a href="mailto:sjr.dev@protonmail.com"  class="email-link" aria-label="Send an email to Sammy John Rawlinson at sjr.dev@protonmail.com">
                        <i class="fas fa-envelope"></i> sjr.dev@protonmail.com
                    </a>
                    </div>
                    <div class="footer-right">
                        <h4>Follow</h4>
                        <div class="social-links">
                            <a href="https://x.com/nabu_tech" target="_blank" aria-label="Follow us on Twitter">
                                <i class="fab fa-twitter"></i> Twitter
                            </a>
                            <a href="https://www.linkedin.com/in/sammyjohnrawlinson/" target="_blank" aria-label="Follow us on LinkedIn">
                                <i class="fab fa-linkedin"></i> LinkedIn
                            </a>
                            <a href="https://github.com/Sammy-John" target="_blank" aria-label="Follow us on GitHub">
                                <i class="fab fa-github"></i> GitHub
                            </a>
                        </div>
                    </div>
                <div class="footer-bottom">
                    <div class="footer-address">
                        <p>&copy; 2024</p>
                        <div class="logo-container">
                            <div class="logo-static" aria-hidden="true"></div>
                            <p class="logo-text-static">
                                <span>e</span><span>k</span><span>N</span><span>a</span><span>b</span><span>u</span>
                            </p>
                        </div>
                        <p>All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    </main>

        <script src="scripts.js"></script> <!-- Link to scripts.js -->
</body>
</html>
`;
}

function copyImages() {
    const sourceDir = path.join(postsDir, 'images');
    const destinationDir = path.join(outputDir, 'images');

    // Check if the source images directory exists
    if (!fs.existsSync(sourceDir)) {
        console.warn('No images directory found in posts folder.');
        return;
    }

    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Copy each file from the source directory to the destination directory
    fs.readdirSync(sourceDir).forEach(file => {
        const sourceFile = path.join(sourceDir, file);
        const destinationFile = path.join(destinationDir, file);

        // Ensure it's a file before copying
        if (fs.lstatSync(sourceFile).isFile()) {
            fs.copyFileSync(sourceFile, destinationFile);
            console.log(`Copied ${file} to output/images.`);
        }
    });
}

                  
function generateBlog() {
    const postsMetadata = [];

    // Read each markdown file in the /posts directory
    const files = fs.readdirSync(postsDir);
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(postsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            const metadata = parseMetadata(content);

            if (!metadata.title || !metadata.summary) {
                console.warn(`Skipping file ${file} due to missing metadata.`);
                return;
            }

            metadata.file = file.replace('.md', '/');
            postsMetadata.push(metadata);

            const postHTML = generatePostHTML(metadata, content);

            // Create a folder for each post
            const postFolder = path.join(outputDir, file.replace('.md', '')); // Remove the .md extension
            if (!fs.existsSync(postFolder)) {
                fs.mkdirSync(postFolder, { recursive: true }); // Ensure the folder exists
            }

            // Write an index.html file inside the folder
            const outputFilePath = path.join(postFolder, 'index.html');
            fs.writeFileSync(outputFilePath, postHTML, 'utf8');
        }
    });

    // Sort postsMetadata by date in descending order (newest first)
    postsMetadata.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Copy images to the output directory
    copyImages();

    // Write the JSON metadata to a file
    fs.writeFileSync(jsonPath, JSON.stringify(postsMetadata, null, 2), 'utf8');

    // Generate and write the homepage
    const homepageHTML = generateHomepageHTML(postsMetadata);
    fs.writeFileSync(path.join(outputDir, 'index.html'), homepageHTML, 'utf8');

    console.log('Blog site generated successfully.');
}




// Run the blog generation
generateBlog();
