import fs from 'fs';
import path from 'path';
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = ""
const hf = new HfInference(HF_TOKEN);
const ep = hf.endpoint("https://api.openai.com/");
const __dirname = path.resolve();

const extractKeywordsAndPrompt = async (content) => {
    const generated_text = await ep.chatCompletion({
        model: "gpt-4o-mini",
        messages: [{
            role: "user",
            content: `${content}\n\nPlease provide the following in JSON format:
      1. Title of the document
      2. Category of the document (website, web app, game, or doc)
         - Website: landing page, frontend only site
         - Web app: can include logic, eg. vue apps.
         - Game: web-based games
         - Doc: non-code documents or explanatory files
      3. Keywords that describe this piece of document (as a string array)
      4. A reverse-engineered prompt that a user might ask to generate this piece of document (as a string)
      5. A list of CDN URLs used in the code, if applicable (as a string array)

      Respond in the following JSON structure:
      {
        "title": "Document Title",
        "category": "Website" | "Web App" | "3D Web Game" | "2D Web Game" | "Document",
        "keywords": ["keyword1", "keyword2", ...],
        "reverseEngineeredPrompt": "What prompt would generate this document?",
        "cdnUrls": ["url1", "url2", ...]
      }`
        }],
        response_format: { type: "json_object" }
    });
    console.log(generated_text.choices[0].message.content);
    return JSON.parse(generated_text.choices[0].message.content);
};



const readFilesFromDirectory = (directoryPath) =>
    fs.readdirSync(directoryPath).filter(file => file.endsWith('.html') || file.endsWith('.md')).map(file => ({
        name: file,
        content: fs.readFileSync(path.join(directoryPath, file), 'utf-8').replace(/<base.*?>/gi, '').replace(/websim/gi, "GPTCall")
    }));

const directories = ['src/examples', 'src/examples2'];
for (let directory of directories) {
    // directory = path.join(__dirname, directory);
    const database = {};
    for (const { name: fileName, content } of readFilesFromDirectory(directory)) {
        try {
            let json = await extractKeywordsAndPrompt(content);
            json.keywords = json.keywords.map(keyword => keyword.toLowerCase());
            json.fileName = fileName;
            json.content = content;
            //json.fullPrompt = await extractReverseEngineeredPrompt(content);
            let category = json.category.toLowerCase();
            json.category = category.includes("game") ? "Web Game" : category.includes("app") ? "Web App" : category.includes("doc") ? "Web App" : category.includes("web") ? "Website" : category;

            //  console.log(`Processing ${fileName, keywords, reverseEngineeredPrompt}...`);
            database[fileName] = json;
        } catch (e) {
            console.error(e);
        }
    }
    fs.writeFileSync(`${directory}/database.js`, "export var database = "+JSON.stringify(database, null, 2));
}
console.log('Database created successfully with keywords and reverse-engineered prompts.');
