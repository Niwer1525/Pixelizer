import {  } from './js/dom.js'
import {Electroview} from "electrobun/view";
import { type MainSchema } from '../shared/types';

const rpc = Electroview.defineRPC<MainSchema>({ handlers: {} });
export const view = new Electroview({ rpc }); // This will be used to invoke backend code with : view.rpc?.request.the_function_to_call(payload);

console.log("Pixelizer loaded!");