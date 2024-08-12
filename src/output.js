var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/@huggingface/inference/dist/index.cjs
var require_dist = __commonJS({
  "node_modules/@huggingface/inference/dist/index.cjs"(exports, module2) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export(src_exports, {
      HfInference: () => HfInference2,
      HfInferenceEndpoint: () => HfInferenceEndpoint,
      InferenceOutputError: () => InferenceOutputError,
      audioClassification: () => audioClassification,
      audioToAudio: () => audioToAudio,
      automaticSpeechRecognition: () => automaticSpeechRecognition,
      chatCompletion: () => chatCompletion,
      chatCompletionStream: () => chatCompletionStream,
      documentQuestionAnswering: () => documentQuestionAnswering,
      featureExtraction: () => featureExtraction,
      fillMask: () => fillMask,
      imageClassification: () => imageClassification,
      imageSegmentation: () => imageSegmentation,
      imageToImage: () => imageToImage,
      imageToText: () => imageToText,
      objectDetection: () => objectDetection,
      questionAnswering: () => questionAnswering,
      request: () => request,
      sentenceSimilarity: () => sentenceSimilarity,
      streamingRequest: () => streamingRequest,
      summarization: () => summarization,
      tableQuestionAnswering: () => tableQuestionAnswering,
      tabularClassification: () => tabularClassification,
      tabularRegression: () => tabularRegression,
      textClassification: () => textClassification,
      textGeneration: () => textGeneration,
      textGenerationStream: () => textGenerationStream,
      textToImage: () => textToImage,
      textToSpeech: () => textToSpeech,
      tokenClassification: () => tokenClassification,
      translation: () => translation,
      visualQuestionAnswering: () => visualQuestionAnswering,
      zeroShotClassification: () => zeroShotClassification,
      zeroShotImageClassification: () => zeroShotImageClassification
    });
    module2.exports = __toCommonJS(src_exports);
    var tasks_exports = {};
    __export(tasks_exports, {
      audioClassification: () => audioClassification,
      audioToAudio: () => audioToAudio,
      automaticSpeechRecognition: () => automaticSpeechRecognition,
      chatCompletion: () => chatCompletion,
      chatCompletionStream: () => chatCompletionStream,
      documentQuestionAnswering: () => documentQuestionAnswering,
      featureExtraction: () => featureExtraction,
      fillMask: () => fillMask,
      imageClassification: () => imageClassification,
      imageSegmentation: () => imageSegmentation,
      imageToImage: () => imageToImage,
      imageToText: () => imageToText,
      objectDetection: () => objectDetection,
      questionAnswering: () => questionAnswering,
      request: () => request,
      sentenceSimilarity: () => sentenceSimilarity,
      streamingRequest: () => streamingRequest,
      summarization: () => summarization,
      tableQuestionAnswering: () => tableQuestionAnswering,
      tabularClassification: () => tabularClassification,
      tabularRegression: () => tabularRegression,
      textClassification: () => textClassification,
      textGeneration: () => textGeneration,
      textGenerationStream: () => textGenerationStream,
      textToImage: () => textToImage,
      textToSpeech: () => textToSpeech,
      tokenClassification: () => tokenClassification,
      translation: () => translation,
      visualQuestionAnswering: () => visualQuestionAnswering,
      zeroShotClassification: () => zeroShotClassification,
      zeroShotImageClassification: () => zeroShotImageClassification
    });
    function pick(o, props) {
      return Object.assign(
        {},
        ...props.map((prop) => {
          if (o[prop] !== void 0) {
            return { [prop]: o[prop] };
          }
        })
      );
    }
    function typedInclude(arr, v) {
      return arr.includes(v);
    }
    function omit(o, props) {
      const propsArr = Array.isArray(props) ? props : [props];
      const letsKeep = Object.keys(o).filter((prop) => !typedInclude(propsArr, prop));
      return pick(o, letsKeep);
    }
    function isUrl(modelOrUrl) {
      return /^http(s?):/.test(modelOrUrl) || modelOrUrl.startsWith("/");
    }
    var taskCache = /* @__PURE__ */ new Map();
    var CACHE_DURATION = 10 * 60 * 1e3;
    var MAX_CACHE_ITEMS = 1e3;
    var HF_HUB_URL = "https://huggingface.co";
    async function getDefaultTask(model, accessToken, options) {
      if (isUrl(model)) {
        return null;
      }
      const key = `${model}:${accessToken}`;
      let cachedTask = taskCache.get(key);
      if (cachedTask && cachedTask.date < new Date(Date.now() - CACHE_DURATION)) {
        taskCache.delete(key);
        cachedTask = void 0;
      }
      if (cachedTask === void 0) {
        const modelTask = await (options?.fetch ?? fetch)(`${HF_HUB_URL}/api/models/${model}?expand[]=pipeline_tag`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        }).then((resp) => resp.json()).then((json) => json.pipeline_tag).catch(() => null);
        if (!modelTask) {
          return null;
        }
        cachedTask = { task: modelTask, date: /* @__PURE__ */ new Date() };
        taskCache.set(key, { task: modelTask, date: /* @__PURE__ */ new Date() });
        if (taskCache.size > MAX_CACHE_ITEMS) {
          taskCache.delete(taskCache.keys().next().value);
        }
      }
      return cachedTask.task;
    }
    var HF_INFERENCE_API_BASE_URL = "https://api-inference.huggingface.co";
    var tasks = null;
    async function makeRequestOptions(args, options) {
      const { accessToken, endpointUrl, ...otherArgs } = args;
      let { model } = args;
      const {
        forceTask: task,
        includeCredentials,
        taskHint,
        wait_for_model,
        use_cache,
        dont_load_model,
        chatCompletion: chatCompletion2
      } = options ?? {};
      const headers = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      if (!model && !tasks && taskHint) {
        const res = await fetch(`${HF_HUB_URL}/api/tasks`);
        if (res.ok) {
          tasks = await res.json();
        }
      }
      if (!model && tasks && taskHint) {
        const taskInfo = tasks[taskHint];
        if (taskInfo) {
          model = taskInfo.models[0].id;
        }
      }
      if (!model) {
        throw new Error("No model provided, and no default model found for this task");
      }
      const binary = "data" in args && !!args.data;
      if (!binary) {
        headers["Content-Type"] = "application/json";
      }
      if (wait_for_model) {
        headers["X-Wait-For-Model"] = "true";
      }
      if (use_cache === false) {
        headers["X-Use-Cache"] = "false";
      }
      if (dont_load_model) {
        headers["X-Load-Model"] = "0";
      }
      let url = (() => {
        if (endpointUrl && isUrl(model)) {
          throw new TypeError("Both model and endpointUrl cannot be URLs");
        }
        if (isUrl(model)) {
          console.warn("Using a model URL is deprecated, please use the `endpointUrl` parameter instead");
          return model;
        }
        if (endpointUrl) {
          return endpointUrl;
        }
        if (task) {
          return `${HF_INFERENCE_API_BASE_URL}/pipeline/${task}/${model}`;
        }
        return `${HF_INFERENCE_API_BASE_URL}/models/${model}`;
      })();
      if (chatCompletion2 && !url.endsWith("/chat/completions")) {
        url += "/v1/chat/completions";
      }
      let credentials;
      if (typeof includeCredentials === "string") {
        credentials = includeCredentials;
      } else if (includeCredentials === true) {
        credentials = "include";
      }
      const info = {
        headers,
        method: "POST",
        body: binary ? args.data : JSON.stringify({
          ...otherArgs.model && isUrl(otherArgs.model) ? omit(otherArgs, "model") : otherArgs
        }),
        ...credentials && { credentials },
        signal: options?.signal
      };
      return { url, info };
    }
    async function request(args, options) {
      const { url, info } = await makeRequestOptions(args, options);
      const response = await (options?.fetch ?? fetch)(url, info);
      if (options?.retry_on_error !== false && response.status === 503 && !options?.wait_for_model) {
        return request(args, {
          ...options,
          wait_for_model: true
        });
      }
      if (!response.ok) {
        if (response.headers.get("Content-Type")?.startsWith("application/json")) {
          const output = await response.json();
          if ([400, 422, 404, 500].includes(response.status) && options?.chatCompletion) {
            throw new Error(`Server ${args.model} does not seem to support chat completion. Error: ${output.error}`);
          }
          if (output.error) {
            throw new Error(output.error);
          }
        }
        throw new Error("An error occurred while fetching the blob");
      }
      if (response.headers.get("Content-Type")?.startsWith("application/json")) {
        return await response.json();
      }
      return await response.blob();
    }
    function getLines(onLine) {
      let buffer;
      let position;
      let fieldLength;
      let discardTrailingNewline = false;
      return function onChunk(arr) {
        if (buffer === void 0) {
          buffer = arr;
          position = 0;
          fieldLength = -1;
        } else {
          buffer = concat(buffer, arr);
        }
        const bufLength = buffer.length;
        let lineStart = 0;
        while (position < bufLength) {
          if (discardTrailingNewline) {
            if (buffer[position] === 10) {
              lineStart = ++position;
            }
            discardTrailingNewline = false;
          }
          let lineEnd = -1;
          for (; position < bufLength && lineEnd === -1; ++position) {
            switch (buffer[position]) {
              case 58:
                if (fieldLength === -1) {
                  fieldLength = position - lineStart;
                }
                break;
              case 13:
                discardTrailingNewline = true;
              case 10:
                lineEnd = position;
                break;
            }
          }
          if (lineEnd === -1) {
            break;
          }
          onLine(buffer.subarray(lineStart, lineEnd), fieldLength);
          lineStart = position;
          fieldLength = -1;
        }
        if (lineStart === bufLength) {
          buffer = void 0;
        } else if (lineStart !== 0) {
          buffer = buffer.subarray(lineStart);
          position -= lineStart;
        }
      };
    }
    function getMessages(onId, onRetry, onMessage) {
      let message = newMessage();
      const decoder = new TextDecoder();
      return function onLine(line, fieldLength) {
        if (line.length === 0) {
          onMessage?.(message);
          message = newMessage();
        } else if (fieldLength > 0) {
          const field = decoder.decode(line.subarray(0, fieldLength));
          const valueOffset = fieldLength + (line[fieldLength + 1] === 32 ? 2 : 1);
          const value = decoder.decode(line.subarray(valueOffset));
          switch (field) {
            case "data":
              message.data = message.data ? message.data + "\n" + value : value;
              break;
            case "event":
              message.event = value;
              break;
            case "id":
              onId(message.id = value);
              break;
            case "retry":
              const retry = parseInt(value, 10);
              if (!isNaN(retry)) {
                onRetry(message.retry = retry);
              }
              break;
          }
        }
      };
    }
    function concat(a, b) {
      const res = new Uint8Array(a.length + b.length);
      res.set(a);
      res.set(b, a.length);
      return res;
    }
    function newMessage() {
      return {
        data: "",
        event: "",
        id: "",
        retry: void 0
      };
    }
    async function* streamingRequest(args, options) {
      const { url, info } = await makeRequestOptions({ ...args, stream: true }, options);
      const response = await (options?.fetch ?? fetch)(url, info);
      if (options?.retry_on_error !== false && response.status === 503 && !options?.wait_for_model) {
        return yield* streamingRequest(args, {
          ...options,
          wait_for_model: true
        });
      }
      if (!response.ok) {
        if (response.headers.get("Content-Type")?.startsWith("application/json")) {
          const output = await response.json();
          if ([400, 422, 404, 500].includes(response.status) && options?.chatCompletion) {
            throw new Error(`Server ${args.model} does not seem to support chat completion. Error: ${output.error}`);
          }
          if (output.error) {
            throw new Error(output.error);
          }
        }
        throw new Error(`Server response contains error: ${response.status}`);
      }
      if (!response.headers.get("content-type")?.startsWith("text/event-stream")) {
        throw new Error(
          `Server does not support event stream content type, it returned ` + response.headers.get("content-type")
        );
      }
      if (!response.body) {
        return;
      }
      const reader = response.body.getReader();
      let events = [];
      const onEvent = (event) => {
        events.push(event);
      };
      const onChunk = getLines(
        getMessages(
          () => {
          },
          () => {
          },
          onEvent
        )
      );
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done)
            return;
          onChunk(value);
          for (const event of events) {
            if (event.data.length > 0) {
              if (event.data === "[DONE]") {
                return;
              }
              const data = JSON.parse(event.data);
              if (typeof data === "object" && data !== null && "error" in data) {
                throw new Error(data.error);
              }
              yield data;
            }
          }
          events = [];
        }
      } finally {
        reader.releaseLock();
      }
    }
    var InferenceOutputError = class extends TypeError {
      constructor(message) {
        super(
          `Invalid inference output: ${message}. Use the 'request' method with the same parameters to do a custom call with no type checking.`
        );
        this.name = "InferenceOutputError";
      }
    };
    async function audioClassification(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "audio-classification"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
      }
      return res;
    }
    async function automaticSpeechRecognition(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "automatic-speech-recognition"
      });
      const isValidOutput = typeof res?.text === "string";
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected {text: string}");
      }
      return res;
    }
    async function textToSpeech(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "text-to-speech"
      });
      const isValidOutput = res && res instanceof Blob;
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Blob");
      }
      return res;
    }
    async function audioToAudio(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "audio-to-audio"
      });
      const isValidOutput = Array.isArray(res) && res.every(
        (x) => typeof x.label === "string" && typeof x.blob === "string" && typeof x["content-type"] === "string"
      );
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{label: string, blob: string, content-type: string}>");
      }
      return res;
    }
    async function imageClassification(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "image-classification"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
      }
      return res;
    }
    async function imageSegmentation(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "image-segmentation"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.mask === "string" && typeof x.score === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{label: string, mask: string, score: number}>");
      }
      return res;
    }
    async function imageToText(args, options) {
      const res = (await request(args, {
        ...options,
        taskHint: "image-to-text"
      }))?.[0];
      if (typeof res?.generated_text !== "string") {
        throw new InferenceOutputError("Expected {generated_text: string}");
      }
      return res;
    }
    async function objectDetection(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "object-detection"
      });
      const isValidOutput = Array.isArray(res) && res.every(
        (x) => typeof x.label === "string" && typeof x.score === "number" && typeof x.box.xmin === "number" && typeof x.box.ymin === "number" && typeof x.box.xmax === "number" && typeof x.box.ymax === "number"
      );
      if (!isValidOutput) {
        throw new InferenceOutputError(
          "Expected Array<{label:string; score:number; box:{xmin:number; ymin:number; xmax:number; ymax:number}}>"
        );
      }
      return res;
    }
    async function textToImage(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "text-to-image"
      });
      const isValidOutput = res && res instanceof Blob;
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Blob");
      }
      return res;
    }
    function base64FromBytes(arr) {
      if (globalThis.Buffer) {
        return globalThis.Buffer.from(arr).toString("base64");
      } else {
        const bin = [];
        arr.forEach((byte) => {
          bin.push(String.fromCharCode(byte));
        });
        return globalThis.btoa(bin.join(""));
      }
    }
    async function imageToImage(args, options) {
      let reqArgs;
      if (!args.parameters) {
        reqArgs = {
          accessToken: args.accessToken,
          model: args.model,
          data: args.inputs
        };
      } else {
        reqArgs = {
          ...args,
          inputs: base64FromBytes(
            new Uint8Array(args.inputs instanceof ArrayBuffer ? args.inputs : await args.inputs.arrayBuffer())
          )
        };
      }
      const res = await request(reqArgs, {
        ...options,
        taskHint: "image-to-image"
      });
      const isValidOutput = res && res instanceof Blob;
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Blob");
      }
      return res;
    }
    async function zeroShotImageClassification(args, options) {
      const reqArgs = {
        ...args,
        inputs: {
          image: base64FromBytes(
            new Uint8Array(
              args.inputs.image instanceof ArrayBuffer ? args.inputs.image : await args.inputs.image.arrayBuffer()
            )
          )
        }
      };
      const res = await request(reqArgs, {
        ...options,
        taskHint: "zero-shot-image-classification"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
      }
      return res;
    }
    async function featureExtraction(args, options) {
      const defaultTask = args.model ? await getDefaultTask(args.model, args.accessToken, options) : void 0;
      const res = await request(args, {
        ...options,
        taskHint: "feature-extraction",
        ...defaultTask === "sentence-similarity" && { forceTask: "feature-extraction" }
      });
      let isValidOutput = true;
      const isNumArrayRec = (arr, maxDepth, curDepth = 0) => {
        if (curDepth > maxDepth)
          return false;
        if (arr.every((x) => Array.isArray(x))) {
          return arr.every((x) => isNumArrayRec(x, maxDepth, curDepth + 1));
        } else {
          return arr.every((x) => typeof x === "number");
        }
      };
      isValidOutput = Array.isArray(res) && isNumArrayRec(res, 3, 0);
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<number[][][] | number[][] | number[] | number>");
      }
      return res;
    }
    async function fillMask(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "fill-mask"
      });
      const isValidOutput = Array.isArray(res) && res.every(
        (x) => typeof x.score === "number" && typeof x.sequence === "string" && typeof x.token === "number" && typeof x.token_str === "string"
      );
      if (!isValidOutput) {
        throw new InferenceOutputError(
          "Expected Array<{score: number, sequence: string, token: number, token_str: string}>"
        );
      }
      return res;
    }
    async function questionAnswering(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "question-answering"
      });
      const isValidOutput = typeof res === "object" && !!res && typeof res.answer === "string" && typeof res.end === "number" && typeof res.score === "number" && typeof res.start === "number";
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected {answer: string, end: number, score: number, start: number}");
      }
      return res;
    }
    async function sentenceSimilarity(args, options) {
      const defaultTask = args.model ? await getDefaultTask(args.model, args.accessToken, options) : void 0;
      const res = await request(args, {
        ...options,
        taskHint: "sentence-similarity",
        ...defaultTask === "feature-extraction" && { forceTask: "sentence-similarity" }
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected number[]");
      }
      return res;
    }
    async function summarization(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "summarization"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.summary_text === "string");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{summary_text: string}>");
      }
      return res?.[0];
    }
    async function tableQuestionAnswering(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "table-question-answering"
      });
      const isValidOutput = typeof res?.aggregator === "string" && typeof res.answer === "string" && Array.isArray(res.cells) && res.cells.every((x) => typeof x === "string") && Array.isArray(res.coordinates) && res.coordinates.every((coord) => Array.isArray(coord) && coord.every((x) => typeof x === "number"));
      if (!isValidOutput) {
        throw new InferenceOutputError(
          "Expected {aggregator: string, answer: string, cells: string[], coordinates: number[][]}"
        );
      }
      return res;
    }
    async function textClassification(args, options) {
      const res = (await request(args, {
        ...options,
        taskHint: "text-classification"
      }))?.[0];
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.label === "string" && typeof x.score === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
      }
      return res;
    }
    function toArray(obj) {
      if (Array.isArray(obj)) {
        return obj;
      }
      return [obj];
    }
    async function textGeneration(args, options) {
      const res = toArray(
        await request(args, {
          ...options,
          taskHint: "text-generation"
        })
      );
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.generated_text === "string");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{generated_text: string}>");
      }
      return res?.[0];
    }
    async function* textGenerationStream(args, options) {
      yield* streamingRequest(args, {
        ...options,
        taskHint: "text-generation"
      });
    }
    async function tokenClassification(args, options) {
      const res = toArray(
        await request(args, {
          ...options,
          taskHint: "token-classification"
        })
      );
      const isValidOutput = Array.isArray(res) && res.every(
        (x) => typeof x.end === "number" && typeof x.entity_group === "string" && typeof x.score === "number" && typeof x.start === "number" && typeof x.word === "string"
      );
      if (!isValidOutput) {
        throw new InferenceOutputError(
          "Expected Array<{end: number, entity_group: string, score: number, start: number, word: string}>"
        );
      }
      return res;
    }
    async function translation(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "translation"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.translation_text === "string");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected type Array<{translation_text: string}>");
      }
      return res?.length === 1 ? res?.[0] : res;
    }
    async function zeroShotClassification(args, options) {
      const res = toArray(
        await request(args, {
          ...options,
          taskHint: "zero-shot-classification"
        })
      );
      const isValidOutput = Array.isArray(res) && res.every(
        (x) => Array.isArray(x.labels) && x.labels.every((_label) => typeof _label === "string") && Array.isArray(x.scores) && x.scores.every((_score) => typeof _score === "number") && typeof x.sequence === "string"
      );
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{labels: string[], scores: number[], sequence: string}>");
      }
      return res;
    }
    async function chatCompletion(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "text-generation",
        chatCompletion: true
      });
      const isValidOutput = typeof res === "object" && Array.isArray(res?.choices) && typeof res?.created === "number" && typeof res?.id === "string" && typeof res?.model === "string" && typeof res?.system_fingerprint === "string" && typeof res?.usage === "object";
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected ChatCompletionOutput");
      }
      return res;
    }
    async function* chatCompletionStream(args, options) {
      yield* streamingRequest(args, {
        ...options,
        taskHint: "text-generation",
        chatCompletion: true
      });
    }
    async function documentQuestionAnswering(args, options) {
      const reqArgs = {
        ...args,
        inputs: {
          question: args.inputs.question,
          // convert Blob or ArrayBuffer to base64
          image: base64FromBytes(
            new Uint8Array(
              args.inputs.image instanceof ArrayBuffer ? args.inputs.image : await args.inputs.image.arrayBuffer()
            )
          )
        }
      };
      const res = toArray(
        await request(reqArgs, {
          ...options,
          taskHint: "document-question-answering"
        })
      )?.[0];
      const isValidOutput = typeof res?.answer === "string" && (typeof res.end === "number" || typeof res.end === "undefined") && (typeof res.score === "number" || typeof res.score === "undefined") && (typeof res.start === "number" || typeof res.start === "undefined");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{answer: string, end?: number, score?: number, start?: number}>");
      }
      return res;
    }
    async function visualQuestionAnswering(args, options) {
      const reqArgs = {
        ...args,
        inputs: {
          question: args.inputs.question,
          // convert Blob or ArrayBuffer to base64
          image: base64FromBytes(
            new Uint8Array(
              args.inputs.image instanceof ArrayBuffer ? args.inputs.image : await args.inputs.image.arrayBuffer()
            )
          )
        }
      };
      const res = (await request(reqArgs, {
        ...options,
        taskHint: "visual-question-answering"
      }))?.[0];
      const isValidOutput = typeof res?.answer === "string" && typeof res.score === "number";
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected Array<{answer: string, score: number}>");
      }
      return res;
    }
    async function tabularRegression(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "tabular-regression"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected number[]");
      }
      return res;
    }
    async function tabularClassification(args, options) {
      const res = await request(args, {
        ...options,
        taskHint: "tabular-classification"
      });
      const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
      if (!isValidOutput) {
        throw new InferenceOutputError("Expected number[]");
      }
      return res;
    }
    var HfInference2 = class {
      accessToken;
      defaultOptions;
      constructor(accessToken = "", defaultOptions = {}) {
        this.accessToken = accessToken;
        this.defaultOptions = defaultOptions;
        for (const [name, fn] of Object.entries(tasks_exports)) {
          Object.defineProperty(this, name, {
            enumerable: false,
            value: (params, options) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fn({ ...params, accessToken }, { ...defaultOptions, ...options })
            )
          });
        }
      }
      /**
       * Returns copy of HfInference tied to a specified endpoint.
       */
      endpoint(endpointUrl) {
        return new HfInferenceEndpoint(endpointUrl, this.accessToken, this.defaultOptions);
      }
    };
    var HfInferenceEndpoint = class {
      constructor(endpointUrl, accessToken = "", defaultOptions = {}) {
        accessToken;
        defaultOptions;
        for (const [name, fn] of Object.entries(tasks_exports)) {
          Object.defineProperty(this, name, {
            enumerable: false,
            value: (params, options) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fn({ ...params, accessToken, endpointUrl }, { ...defaultOptions, ...options })
            )
          });
        }
      }
    };
  }
});

// entry.js
var { HfInference } = require_dist();
globalThis.HfInference = HfInference;
