

let settings = {
  apiUrl:"",
  apiKey:"",
  model: { selected: "gemini-1.5-flash-latest", options: ["gemini-1.5-pro-exp-0801", "gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gpt-4o-mini"] },  
  isDarkTheme: true,
  variantCount: 1,
  disableExamples: false,
  contacts: [
    { name: 'None', systemPrompt: undefined,databases:[] },
    ...Object.values(engineers)
  ],

}
let manifest = 
{
  "name": "title",
  "display": "fullscreen",
  "start_url": "./index.html",
  "short_name": "title",
  "theme_color": "#6a1b9a",
  "description": "",
  "orientation": "portrait",
  "background_color": "#6a1b9a",
  "related_applications": [],
  "prefer_related_applications": false,
  "icons": [
      {
          "src": "favicon.png",
          "sizes": "512x512"
      }
  ],
  "features": [
      "Cross Platform",
      "fast",
      "simple"
  ]
}
