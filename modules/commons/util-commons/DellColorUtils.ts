export const blue = '#0076CE'
export const carbon = "#444444"
export const midnight = "#00447C"
export const lightBlue = '#41B6E6'
export const purple = '#6E2585'
export const LIGHT_PURPLE = '#795C83'
export const berry = '#B7295A'
export const orange = '#EE6411'
export const gray = '#808080'
export const LIGHT_GRAY = '#B0B0B0'
export const granite = '#C8C9C7'
export const quartz = '#EEEEEE'
export const red = '#CE1126'
export const green = '#6EA204'
export const lightGreen = '#90ee90'
export const yellow = '#F2AF00'
export const white = '#FFFFFF'
export const pink = '#FFC0CB'
export const lilac = '#c8a2c8'
export const lightBrown = '#C49C94'


export const dellColors = {
    //STATIC
    blue: blue,
    midnight: midnight,
    lightBlue: lightBlue,
    purple: purple,
    lightPurple: LIGHT_PURPLE,
    white: white,
    berry: berry,
    orange: orange,
    gray: gray,
    lightGray: LIGHT_GRAY,
    granite: granite,
    quartz: quartz,
    red: red,
    green: green,
    lightGreen: lightGreen,
    yellow: yellow,
    used: blue,
    available: granite,
    free: lightBlue,
    allocated: berry,
    info: blue,
    warning: yellow,
    success: green,
    healthy: green,
    error: orange,
    danger: red,  
    pink: pink,
    lilac: lilac,
    lightBrown: lightBrown,
}

export const dellNivoColors = {
    //STATIC
    blue: blue+'cc',
    blue_aa: blue+'aa',
    midnight: midnight+'cc',
    lightBlue: lightBlue+'cc',
    purple: purple+'cc',
    white: white+'cc',
    berry: berry+'cc',
    orange: orange+'cc',
    gray: gray+'cc',
    lightGray: LIGHT_GRAY+'cc',
    granite: granite+'cc',
    quartz: quartz+'cc',
    red: red+'cc',
    green: green+'cc',
    yellow: yellow+'cc',
    used: blue+'cc',
    available: granite+'cc',
    free: lightBlue+'cc',
    allocated: green+'cc',
    info: blue+'cc',
    warning: yellow+'cc',
    success: green+'cc',
    healthy: green+'cc',
    error: orange+'cc',
    danger: red+'cc',  
}

export const DELL_COLORS = [
    blue, red, green, yellow, purple, berry, midnight, lightBlue, orange, granite, white, lightGreen, quartz, gray
]

export const TIER_COLORS = [granite, LIGHT_PURPLE, berry, blue, lilac, orange]

export function getApexColorList() {
    return [blue, orange, purple, berry, green, midnight, "#8B4513", gray, pink, dellColors.info, blue, orange, purple, berry, green, midnight, "#8B4513", gray, pink, dellColors.info, blue, orange, purple, berry, green, midnight, "#8B4513", gray, pink, dellColors.info]
}

export function getApexLightColorList() {
    return [lightBlue, orange, LIGHT_PURPLE, red, lightGreen, granite, lightBrown, dellColors.lightGray, lilac, dellColors.free, lightBlue, orange, LIGHT_PURPLE, red, lightGreen, granite, lightBrown, dellColors.lightGray, lilac, dellColors.free, lightBlue, orange, LIGHT_PURPLE, red, lightGreen, granite, lightBrown, dellColors.lightGray, lilac, dellColors.free]
}