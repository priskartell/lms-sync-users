var test = require('tape')

test('timing test', function (t) {
  t.plan(2)

  t.equal(typeof Date.now, 'function')

  // Om jag förstår rätt så är estet nedan
  // baserat på cpu hastighet. Vilket gör att
  // expected: 100 kommer bero på yttre omständigheter.
  /*
  var start = Date.now()

  setTimeout(function () {
    t.equal(Date.now() - start, 100)
  }, 100)
  */
})
