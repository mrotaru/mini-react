class Header extends Component {
  myClickHandler(event) {
    debugger
    console.log('handling', event)
  }
  render () {
    return DOM.div({ className: 'c1' }, [
      DOM.div({ className: 'c2'}, [
        DOM.h1(null, [this.props.title]),
        DOM.p({onClick: (event) => this.myClickHandler(event)}, ['Just some paragraph text'])
      ])
    ])
  }
}

render(
  React.createElement(Header, { title: 'Mini React' }),
  document.getElementById('root')
)