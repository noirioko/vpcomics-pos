import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faHouse,
  faCashRegister,
  faTableList,
  faBoxesStacked,
  faClipboardList,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons'

// Disable auto CSS injection — we import the CSS ourselves via nuxt.config
config.autoAddCss = false

library.add(faHouse, faCashRegister, faTableList, faBoxesStacked, faClipboardList, faChartLine)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FaIcon', FontAwesomeIcon)
})
