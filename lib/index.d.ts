import { Node } from 'unist';
declare const processWikiLinks: ({ markdownAST }: {
    markdownAST: Node;
}, options?: {
    titleToURLPath?: string;
    stripBrackets?: boolean;
    stripDefinitionExts?: string[];
}) => void;
export default processWikiLinks;
