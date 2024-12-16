import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesPath = path.join(__dirname, '..', 'public', 'articles.json');
const apiUrl = 'http://localhost:3000/api/articles/bulk';

async function bulkInsertArticles() {
  try {
    console.log(`Attempting to read file from: ${articlesPath}`);
    
    if (!fs.existsSync(articlesPath)) {
      console.error(`Error: The file ${articlesPath} does not exist.`);
      console.log('Please make sure you have created the articles.json file in the public directory.');
      return;
    }

    const articlesData = fs.readFileSync(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);

    console.log(`Successfully read ${articles.length} articles from the file.`);

    console.log(`Sending request to ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articles),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Bulk insertion result:', result);
  } catch (error) {
    console.error('Error inserting articles:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Make sure your Next.js server is running on http://localhost:3000');
    }
  }
}

bulkInsertArticles();