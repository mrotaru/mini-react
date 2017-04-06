let instancesByReactRootID = new Map()
let containersByReactRootID = new Map()
let containerIndex = 0

class ReactElement {
  constructor (type, props) {
    this.type = type
    this.props = props
  }
}

var createElement = function (type, config, children) {
  var props = {}
  Object.assign(props, config)
  props.children = children
  return new ReactElement(type, props)
}

let DOM = {}
;['div', 'a', 'h1', 'p'].map(type => DOM[type] = (config, children) => {
  return createElement(type, config, children)
})

class ReactDOMTextComponent {
  constructor (text) {
    this._currentElement = text
  }
  mountComponent (rootId) {
    this._rootId = rootId
    return `<span data-reactid="${rootId}">${this._currentElement}</span>`
  }
}

class ReactDOMComponent {
  constructor (element) {
    this._currentElement = element
  }
  mountComponent(rootId) {
    this._rootId = rootId
    let el = this._currentElement
    let tagOpen = `<${el.type} ${this.createMarkupForStyles(el.props)} data-react-id="${this._rootId}">`
    let tagClose = `</${el.type}`
    let tagContent = ''
    if (el.props.children) {
      let subIndex = 0
      this._renderedComponents = el.props.children.map(el => instantiateReactComponent(el))
      tagContent = this._renderedComponents.reduce((acc, comp) => {
        let nextId = `${rootId}.${subIndex++}`
        return `${acc}${comp.mountComponent(nextId)}`
      }, '')
    }
    return `${tagOpen}${tagContent}${tagClose}`
  }
  createMarkupForStyles(props) {
    return props.className
      ? ` class="${props.className}"`
      : ''
  }
}

class ReactCompositeComponent {
  constructor (element) {
    this._currentElement = element
  }
  mountComponent (rootId) {
    this._rootId = rootId
    let elementInstance = new this._currentElement.type(this._currentElement.props)
    let renderedElement = elementInstance.render()
    this._renderedComponent = instantiateReactComponent(renderedElement)
    return this._renderedComponent.mountComponent(rootId)
  }
}

function instantiateReactComponent(el) {
  if(typeof el === 'object') {
    if (typeof el.type === 'string') {
      return new ReactDOMComponent(el)
    } else if (typeof el.type === 'function') {
      return new ReactCompositeComponent(el)
    }
  } else if (typeof el === 'string' || typeof el === 'number') {
    return new ReactDOMTextComponent(el)
  }
}

class Component {
  constructor(props, updater) {
    this.props = props
    this.updater = updater
    this.state = this.getInitialState()
  }
  getInitialState () {
    return {}
  }
  setState (newState) {
    Object.assign(this.state, newState)
    this.updater.receiveComponent(this.render())
  }
  render () {
    return { type: 'div', props: {} }
  }
}

const render = (element, container) => {
  let topComponent = instantiateReactComponent(element)
  let reactRootId = registerComponent(topComponent, container)
  container.innerHTML = topComponent.mountComponent(reactRootId)
}

const registerComponent = (component, container) => {
  const reactRootId = getRootIdString()
  instancesByReactRootID.set(reactRootId, component)
  containersByReactRootID.set(reactRootId, container)
  return reactRootId
}

const getRootIdString = () => `.${containerIndex++}`

const React = {
  DOM,
  createElement,
  render,
  Component
}
