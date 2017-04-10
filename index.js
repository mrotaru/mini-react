// Element.type is string ('div', 'h1') or fn
// but also the element itself can be a string, not obj
// from El, inst C
class Header extends Component {
  render () {
    return DOM.div({ className: 'c1'}, [
      DOM.h1(null, [this.props.title])
    ])
  }
}

render(
  // React.createElement('h1', null, ['This is a header']),
  DOM.h1(null, ['Another method of creating a header']),
  // React.createElement(Header, { title: 'Mini React' }),
  document.getElementById('root')
)