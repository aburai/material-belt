/**
 * Helper types for material-belt.js
 */
export interface DialogParams {
    width?: number
    title?: string
    subtitle?: string
    content?: string
    agree?: string
    agreeColored?: boolean
    disagree?: string
    disagreeColored?: boolean
    cls?: string
    open?: boolean
    destroy?: boolean
    submitOnReturn?: boolean
    closeOnEsc?: boolean
    timeout?: number
    on?: {
        agree?: () => void
        disagree?: () => void
        beforeShow?: () => void
    }
}
export interface DrawerParams {
    appendTo?: any
    title?: string
    width?: string | number
    trigger?: any
    overlay?: boolean
    fixed?: boolean
    open?: boolean
    mini?: boolean
    on?: {
        open?: () => void
        close?: () => void
        select?: () => void
        action?: () => void
        breakpoint?: () => void
    }
    offset?: {
        top?: number
        bottom?: number
    }
}
export interface SnackbarParams {
    appendTo: any
    absolute?: boolean
    message: string
    type?: 'info' | 'success' | 'warning' | 'danger'
    timeout?: number
    actionText?: string
    actionHandler?: () => void
}
export interface TextfieldParams {
    appendTo?: any
    prependTo?: any
    id?: string
    label?: string
    name?: string
    value?: string | number
    floatLabel?: boolean
    clear?: boolean
    size?: number
    maxlength?: number
    placeholder?: string
    autofocus?: boolean
    resize?: boolean
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    hidden?: boolean
    spellcheck?: boolean
    tabindex?: string
    rows?: number
    width?: number
    cls?: string
    helper?: string
    date?: boolean
    time?: boolean
    data?: any
    attr?: any
}
export interface RadioOptions {
    id: string
    label: string
    value: string
    name?: string
    checked?: boolean
}
export interface RadioParams {
    appendTo?: any
    name?: string
    label?: string
    helper?: string
}

declare interface Window {
    material?: MaterialBelt & typeof MaterialBelt
}
declare interface MaterialBelt {
    textfield: (params: TextfieldParams) => any
    dialog: (params: DialogParams) => any
    drawer: (params: DrawerParams) => any
    snackbar: (params: SnackbarParams, callback?: () => void) => any
    radio: (options: RadioOptions[], params?: RadioParams) => string[]
}
declare namespace MaterialBelt {

}


interface AnimateCssOptions {
    animationName: string
    animationSpeed?: 'slow' | 'slower' | 'fast' | 'faster' | ''
    callback?: () => void
}
declare global {
    interface JQuery {
        animateCss(options: AnimateCssOptions): JQuery
    }
}

