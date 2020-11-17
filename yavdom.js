export function h (...params) {
  if (!isProps(params[1])) {
    params.splice(1, 0, {})
  }
  return {
    vNode: 7,
    tag: params[0],
    props: wrap(params[1]),
    children: flatten(params.slice(2)),
  }
}

export function mount (root, render) {
  ready(function () {
    if (!views) {
      views = new Map()
    }
    if (typeof root === 'string') {
      root = document.querySelector(root)
    }
    root.innerHTML = ''
    views.set(root, {
      root,
      render,
      vRoot: h('')
    })
    update()
  })
}

export function unmount (root) {
  while (root !== document) {
    if (views.has(root)) {
      views = new Map(views)
      views.delete(root)
      root.innerHTML = ''
      break
    }
    root = root.parentNode
  }
}

export function update () {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(function () {
    for (let view of views.values()) {
      let vRoot = h('', view.render.call(null))
      patch(view.vRoot, vRoot, view.root)
      view.vRoot = vRoot
    }
  })
}

let views
let frame

function isProps (value) {
  return typeof value === 'object'
    && value !== null
    && value.constructor === Object
    && value.vNode !== 7
}

function wrap (props) {
  for (let key in props) {
    let value = props[key]
    if (key.slice(0, 2) === 'on') {
      props[key] = function (event) {
        value.call(this, event)
        update()
      }
    }
  }
  return props
}

function flatten (children, result = []) {
  for (let child of children) {
    if (child === undefined || child === null) {
      result.push(text(''))
    } else if (Array.isArray(child)) {
      flatten(child, result)
    } else if (child.vNode === 7) {
      result.push(child)
    } else {
      result.push(text(String(child)))
    }
  }
  return result
}

function text (text) {
  return {
    vNode: 7,
    tag: 7,
    props: { text },
    children: []
  }
}

function ready (callback) {
  if (document.readyState !== 'loading') {
    callback()
  } else {
    addEventListener('DOMContentLoaded', callback)
  }
}

function patch ({ tag, props, children }, next, node) {
  if (tag !== next.tag) {
    node.parentNode.replaceChild(realize(next), node)
  } else if (tag === 7) {
    let text = next.props.text
    if (props.text !== text) {
      node.textContent = text
    }
  } else {
    for (let key in next.props) {
      let value = next.props[key]
      if (props[key] !== value) {
        node[key] = value
      }
    }
    let a = children.length
    let b = next.children.length
    if (a < b) {
      for (let i = a; i < b; i++) {
        node.appendChild(realize(next.children[i]))
      }
    } else if (b < a) {
      for (let i = b; i < a; i++) {
        node.removeChild(node.childNodes[b])
      }
    }
    let c = Math.min(a, b)
    for (let i = 0; i < c; i++) {
      patch(children[i], next.children[i], node.childNodes[i])
    }
  }
}

function realize ({ tag, props, children }) {
  let node
  if (tag === 7) {
    node = document.createTextNode(props.text)
  } else {
    node = document.createElement(tag)
    for (let key in props) {
      node[key] = props[key]
    }
    for (let child of children) {
      node.appendChild(realize(child))
    }
  }
  return node
}
