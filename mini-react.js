let instancesByReactRootID = new Map()
let containersByReactRootID = new Map()
let containerIndex = 0
let elements = []

class ReactElement {
  constructor (type, props) {
    this.type = type
    this.props = props
    elements.push(this)
  }
}

class ReactEventEmitter {
  static init(rootElement) {
    this.eventListeners = new Map()
    this.reactToDomEventType = new Map()
    this.reactToDomEventType.set('onClick', 'click')
    this.trapBubbledEvent('onClick', rootElement)
  }
  static putListener (id, reactEventType, listener) {
    let eventTypeListeners = this.eventListeners.get(reactEventType)
    if (!eventTypeListeners) {
      eventTypeListeners = new Map()
      eventTypeListeners.set(id, listener)
      this.eventListeners.set(reactEventType, eventTypeListeners)
    } else {
      this.eventListeners.set(id, listener)
    }
  }
  static getListener (id, reactEventType) {
    try {
      return this.eventListeners.get(reactEventType).get(id)
    } catch (ex) {
      return null
    }
  }
  static trapBubbledEvent(reactEventType, element) {
    let domEventType = this.reactToDomEventType.get(reactEventType)
    element.addEventListener(domEventType, (event) => {
      event.preventDefault()
      let id = event.target.getAttribute('data-reactid')
      let listener = this.getListener(id, reactEventType)
      if (listener) {
        listener(event)
      }
    })
  }
}

const createElement = (type, config, children) =>
  new ReactElement(type, Object.assign({}, config, { children }))

let DOM = {}
  ;['div', 'a', 'h1', 'p'].map(type => DOM[type] = createElement.bind(null, type))

class Component {
  constructor(props) {
    this.props = props
    this.updater = () => { }
    this.state = this.getInitialState()
  }
  getInitialState() {
    return {}
  }
  setState(newState) {
    Object.assign(this.state, newState)
    this.updater.receiveComponent(this.render())
  }
  render() {
    return this._currentElement
  }
}

class ReactDOMTextComponent extends Component {
  constructor(text) {
    super()
    this._currentElement = text
  }
  mountComponent(rootId) {
    this._rootId = rootId
    return `<span data-reactid="${rootId}">${this._currentElement}</span>`
  }
}

class ReactDOMComponent extends Component {
  constructor(element) {
    super(element.props)
    this._currentElement = element
  }
  mountComponent(rootId) {
    this._rootId = rootId
    let el = this._currentElement
    if (el.props.onClick) {
      ReactEventEmitter.putListener(rootId, 'onClick', el.props.onClick)
    }
    let tagOpen = `<${el.type} ${this.createMarkupForStyles(el.props)} data-reactid="${this._rootId}">`
    let tagClose = `</${el.type}>`
    let tagContent = ''
    if (el.props.children) {
      let subIndex = 0
      this._renderedComponents = el.props.children.map(e => instantiateReactComponent(e))
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
  constructor(element) {
    super(element.props)
    this._currentElement = element
  }
  mountComponent(rootId) {
    // to mount composite components, first we must instantiate the component
    // to be able to call it's `render` method and get an `Element`, which we
    // then use to instantiate another component. We do that because composite
    // components themselves do not produce DOM; they return an element which does
    // (DOM or Text) or it could return another composite component.
    this._rootId = rootId
    let componentInstance = new this._currentElement.type(this._currentElement.props)
    let renderedElement = componentInstance.render()
    this._renderedComponent = instantiateReactComponent(renderedElement)
    return this._renderedComponent.mountComponent(rootId)
  }
}

const instantiateReactComponent = (el) => {
  if (typeof el === 'object') {
    if (typeof el.type === 'string') {
      return new ReactDOMComponent(el)
    } else if (typeof el.type === 'function') {
      return new ReactCompositeComponent(el)
    }
  } else if (typeof el === 'string' || typeof el === 'number') {
    return new ReactDOMTextComponent(el)
  }
}

const render = (reactElement, container) => {
  ReactEventEmitter.init(container)
  let topComponent = instantiateReactComponent(reactElement)
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
  let sequenceId = targetId.split('.')
  sequenceId.shift()
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
  Component,
  getNode
}
