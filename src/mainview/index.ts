import {  } from './js/dom.js'
import {Electroview} from "electrobun/view";
import { type MainSchema } from '../shared/types';

const toMilliseconds = (hrs: any, min: any, sec: any) => (hrs*60*60+min*60+sec) * 1000;

const rpc = Electroview.defineRPC<MainSchema>({
    handlers: {},
    maxRequestTime: toMilliseconds(0, 25, 0)
});
export const view = new Electroview({ rpc }); // This will be used to invoke backend code with : view.rpc?.request.the_function_to_call(payload);

console.log("Pixelizer loaded!");