import {optimizeCutting} from './cuttingOptimizer.js';
self.onmessage=event=>{try{self.postMessage({result:optimizeCutting(event.data)})}catch(error){self.postMessage({error:error.message})}};
