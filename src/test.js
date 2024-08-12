
//import { HfInference } from 'https://esm.sh/@huggingface/inference';

import { HfInference } from "@huggingface/inference";


export default function test(){

};
class BaseClass {
  constructor(name) {
    this.name = name;
  }
}

class ExtendedClass extends BaseClass {
  constructor(name, ...args) {
    super(name); 
    // Extend with fields from another object
    const otherObject = { age: 25, city: 'New York' }; 
    Object.assign(ExtendedClass.prototype, otherObject); // Add fields from otherObject
    
    
  }
}

const extendedInstance = new ExtendedClass('John');
console.log(extendedInstance); // Output: { name: 'John', age: 25, city: 'New York' }