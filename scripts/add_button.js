'use strict'
var but = document.createElement('a')
but.classList.add('ui-button')
but.href = '/courses/'+courseId+'/external_tools/419'
but.innerHTML = 'Exportera resultat'
document.querySelector('.gradebook_menu').appendChild(but)
