"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unist_util_visit_1 = __importDefault(require("unist-util-visit"));
const slugify_1 = __importDefault(require("slugify"));
const path = __importStar(require("path"));
/**
 * if title is something like `folder1/folder2/name`,
 * will slugify the name, while keeping the folder names
 */
const defaultTitleToURLPath = (title) => {
    const segments = title.split('/');
    let titleCandidate = segments.pop();
    const hashIndex = titleCandidate.indexOf('\|');
    if (hashIndex > -1) {
        titleCandidate = titleCandidate.substring(0, hashIndex);
    }
    const hashIndex2 = titleCandidate.indexOf('#');
    if (hashIndex2 > -1) {
        titleCandidate = titleCandidate.substring(0, hashIndex2);
    }
    const slugifiedTitle = slugify_1.default(titleCandidate);
    return `${segments.join('/')}/${slugifiedTitle}`;
};
const processWikiLinks = ({ markdownAST }, options) => {
    const { stripDefinitionExts } = options;
    const titleToURL = (options === null || options === void 0 ? void 0 : options.titleToURLPath)
        ? require(options.titleToURLPath)
        : defaultTitleToURLPath;
    const definitions = {};
    const getLinkInfo = (definition) => {
        if (typeof definition.identifier !== 'string')
            return;
        let linkUrl = definition.url;
        const isExternalLink = /\/\//.test(linkUrl);
        let shouldReplace = !isExternalLink;
        if (shouldReplace && stripDefinitionExts) {
            const extname = path.extname(definition.url || '');
            const matchedExtname = stripDefinitionExts.find((n) => extname === n);
            if (matchedExtname) {
                linkUrl = linkUrl.slice(0, linkUrl.length - matchedExtname.length);
            }
        }
        return {
            linkUrl,
            shouldReplace
        };
    };
    unist_util_visit_1.default(markdownAST, `definition`, (node) => {
        if (!node.identifier || typeof node.identifier !== 'string') {
            return;
        }
        definitions[node.identifier] = node;
    });
    unist_util_visit_1.default(markdownAST, `linkReference`, (node, index, parent) => {
        if (node.referenceType !== 'shortcut') {
            return;
        }
        const definition = definitions[node.identifier];
        const linkInfo = definition ? getLinkInfo(definition) : null;
        const linkUrl = linkInfo ? linkInfo.linkUrl : definition === null || definition === void 0 ? void 0 : definition.url;
        if ((linkInfo && !linkInfo.shouldReplace)) {
            // console.log('should not replace', definitions, node.identifier)
            return;
        }
        const siblings = parent.children;
        if (!siblings || !Array.isArray(siblings)) {
            return;
        }
        const previous = siblings[index - 1];
        const next = siblings[index + 1];
        if (!(previous && next)) {
            return;
        }
        if (!('value' in previous && 'value' in next)) {
            return;
        }
        const previousValue = previous.value;
        const nextValue = next.value;
        if (previous.type !== 'text' ||
            previous.value[previousValue.length - 1] !== '[' ||
            next.type !== 'text' ||
            next.value[0] !== ']') {
            return;
        }
        previous.value = previousValue.replace(/\[$/, '');
        next.value = nextValue.replace(/^\]/, '');
        node.type = 'link'; // cast it to link
        if (definition) {
            node.url = linkUrl;
        }
        else {
            node.url = titleToURL(node.label);
        }
        node.title = node.label;
        if (!(options === null || options === void 0 ? void 0 : options.stripBrackets) && Array.isArray(node.children)) {
            const firstChild = node.children[0];
            if (firstChild && 'value' in firstChild) {
                firstChild.value = `[[${firstChild.value}]]`;
            }
        }
        delete node.label;
        delete node.referenceType;
        delete node.identifier;
    });
};
exports.default = processWikiLinks;
