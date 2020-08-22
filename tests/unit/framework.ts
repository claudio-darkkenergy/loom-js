import { DOMWindow, JSDOM } from 'jsdom';

// import { Framework } from '../../src/framework';

// const { before, suite, test } = intern.getInterface('tdd');
// const { expect } = intern.getPlugin('chai');
const win: DOMWindow = new JSDOM(`
         <!DOCTYPE html>
         <html lang="en">
           <body id="app">
           </body>
         </html>
     `).window;
console.log('hello!', win);

// suite('Framework', () => {
//     const { appId } = {
//         appId: 'app'
//     };
//     const htmlDoc = `
//         <!DOCTYPE html>
//         <html lang="en">
//           <body id="${appId}">
//           </body>
//         </html>
//     `;
//     let window: DOMWindow;

//     before(() => {
//         console.log('world!');
//         window = new JSDOM(htmlDoc).window;
//     });

//     test('should create the app', () => {
//         const { document } = window;
//         const app = new Framework({
//             rootNode: document.getElementById(appId) as Element
//         });

//         expect(app).to.be.instanceOf(Framework);
//     });
// });
