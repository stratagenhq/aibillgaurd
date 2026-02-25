"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapOpenAI = wrapOpenAI;
exports.wrapAnthropic = wrapAnthropic;
const HOST = "https://aibillguard.ai";
function report(model, input, output, key) {
    fetch(`${HOST}/api/ingest`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model, input_tokens: input, output_tokens: output }),
    }).catch(() => { }); // fire-and-forget, never throws, never blocks
}
function wrapOpenAI(client, { key }) {
    var _a;
    const c = (_a = client.chat) === null || _a === void 0 ? void 0 : _a.completions;
    if (!c)
        return client;
    const orig = c.create.bind(c);
    c.create = async (...args) => {
        var _a, _b, _c;
        const res = await orig(...args);
        if (res === null || res === void 0 ? void 0 : res.usage)
            report((_a = res.model) !== null && _a !== void 0 ? _a : "", (_b = res.usage.prompt_tokens) !== null && _b !== void 0 ? _b : 0, (_c = res.usage.completion_tokens) !== null && _c !== void 0 ? _c : 0, key);
        return res;
    };
    return client;
}
function wrapAnthropic(client, { key }) {
    const m = client.messages;
    if (!m)
        return client;
    const orig = m.create.bind(m);
    m.create = async (...args) => {
        var _a, _b, _c;
        const res = await orig(...args);
        if (res === null || res === void 0 ? void 0 : res.usage)
            report((_a = res.model) !== null && _a !== void 0 ? _a : "", (_b = res.usage.input_tokens) !== null && _b !== void 0 ? _b : 0, (_c = res.usage.output_tokens) !== null && _c !== void 0 ? _c : 0, key);
        return res;
    };
    return client;
}
