let instancesByReactRootID = new Map()
let containersByReactRootID = new Map()
let containerIndex = 0

class ReactElement {
  constructor (type, props) {
    this.type = type
    this.props = props
  }
}

const createElement = (type, config, children) =>
  new ReactElement(type, Object.assign({}, config, {children}))


let DOM = {
  h1: (config, children) => createElement('h1', config, children),
  div: (config, children) => createElement('div', config, children)
}

// ;['div', 'a', 'h1', 'p'].map(type => DOM[type] = function createDOMElement(config, children) {
//   return createElement(type, config, children)
// })

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
    return this._currentElement
  }
}

class ReactDOMTextComponent extends Component {
  constructor (text) {
    super(text)
    this._currentElement = text
  }
  mountComponent (rootId) {
    this._rootId = rootId
    return `<span data-reactid="${rootId}">${this._currentElement}</span>`
  }
}

class ReactDOMComponent extends Component {
  constructor (element) {
    super(element)
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

class ReactCompositeComponent extends Component {
  constructor (element) {
    super(element)
    this._currentElement = element
  }
  mountComponent (rootId) {
    this._rootId = rootId
    let componentInstance = new this._currentElement.type(this._currentElement.props)
    let renderedElement = componentInstance.render()
    this._renderedComponent = instantiateReactComponent(renderedElement)
    return this._renderedComponent.mountComponent(rootId)
  }
}

const instantiateReactComponent = (el) => {
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

const getNode = (targetId) => {
  let sequenceId = targetId
    .split('.')
    .shift()
  let child = containersByReactRootID.get(targetId.slice(0, 2))
  while (child) {
    const id = child.getAttribute('data-reactid')
    if (id === targetId) {
      return child
    }
    child = child.children
      ? child.children[sequenceId.shift()]
      : null
  }
}

const React = {
  DOM,
  createElement,
  render,
  Component
}
