import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as jsxRuntime from 'react/jsx-runtime'

const file = 'components/auth/verification-code-input.tsx'
const source = fs.readFileSync(file, 'utf8')
const exports = {}
const OTPInput = () => null
const InputOTPSlot = () => null
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText
vm.runInNewContext(code, { exports, require(name) {
  if (name === 'react') return { forwardRef: fn => fn, useId: () => 'unique-code-id' }
  if (name === 'react/jsx-runtime') return jsxRuntime
  if (name === 'input-otp') return { OTPInput, REGEXP_ONLY_DIGITS: '^\\d+$' }
  if (name === '@/shared/ui/input-otp') return { InputOTPSlot }
  throw new Error(name)
} })
function render(value = ['', '', '', '', '', ''], onChange = () => {}) {
  const tree = exports.VerificationCodeInput({ value, onChange }, null)
  const [label, input] = tree.props.children
  return { label, input }
}

test('code input retains one real input, numeric keyboard, autofill, and non-zooming font', () => {
  const { label, input } = render()
  assert.equal(input.type, OTPInput)
  assert.equal(input.props.maxLength, 6)
  assert.equal(input.props.inputMode, 'numeric')
  assert.equal(input.props.autoComplete, 'one-time-code')
  assert.equal(input.props.style.fontSize, '20px')
  assert.equal(label.props.htmlFor, input.props.id)
  assert.equal(input.props.children.props.children.length, 6)
  assert.match(input.props.children.props.className, /pointer-events-none/)
})

test('typing, complete autofill, deletion, and reset preserve the six-digit state contract', () => {
  let actual
  const { input } = render(['0', '1', '', '', '', ''], value => { actual = Array.from(value) })
  assert.equal(input.props.value, '01')
  for (const value of ['0', '012345', '01234', '']) {
    input.props.onChange(value)
    assert.deepEqual(actual, Array.from({ length: 6 }, (_, i) => value[i] ?? ''))
  }
  assert.equal(input.props.pasteTransformer(' 012-345\n'), '012345')
})

test('both authentication entry points use the shared field without global focus IDs', () => {
  for (const file of ['components/auth/auth-dialog.tsx', 'app/login/page.tsx']) {
    const text = fs.readFileSync(file, 'utf8')
    assert.match(text, /<VerificationCodeInput/)
    assert.doesNotMatch(text, /document\.getElementById\([`'"]code-/)
    assert.match(text, /max-h-\[calc\(100dvh-2rem\)\]/)
  }
})