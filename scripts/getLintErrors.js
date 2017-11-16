// // Try to access variable in inner scope
// if (true) {
//   const foo = 1
// }
// console.log(foo)
// /**
// getLintErrors.js:2:1: Unexpected constant condition.
// getLintErrors.js:3:9: 'foo' is assigned a value but never used.
// getLintErrors.js:5:13: 'foo' is not defined.
// */
//
// // Mistype name of variables
// const bar = 1
// console.log(bar___)
// /**
// getLintErrors.js:14:7: 'bar' is assigned a value but never used.
// getLintErrors.js:15:13: 'bar___' is not defined.
// */
//
// // Two equal signs is not good. should be three
// if ('' == ' ') {
//
// }
// /**
// getLintErrors.js:21:8: Expected '===' and instead saw '=='.
// */
// // re-assign const
// const baz = 1
// baz = 2
//
// /**
// getLintErrors.js:26:7: 'baz' is assigned a value but never used.
// getLintErrors.js:27:1: 'baz' is constant.
// */
