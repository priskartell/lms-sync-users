const test = require('tape')
test('should create an array of all possible sisCourseIds for the given course', t => {
  t.plan(1)
  const calcSisForOmregistrerade = require('../../messages/calcSisForOmregistrerade')
  const result = calcSisForOmregistrerade({ ug1Name: 'ladok2.kurser.KD.1070.omregistrerade_20171' })

  t.deepEqual(result, [
    'KD1070VT171',
    'KD1070VT172',
    'KD1070VT173',
    'KD1070VT174',
    'KD1070VT175',
    'KD1070VT176',
    'KD1070VT177',
    'KD1070VT178',
    'KD1070VT179'
  ])
})
