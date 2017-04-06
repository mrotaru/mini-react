class Header extends Component {
  render () {
    return DOM.div({ className: 'c1'}, [
      DOM.h1(null, [this.props.title])
    ])
  }
}

render(
  React.createElement(Header, { title: 'Mini React' }),
  document.getElementById('root')
)