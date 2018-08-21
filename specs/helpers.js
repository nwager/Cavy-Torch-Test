export async function focusText(identifier) {
  console.log(identifier);
  identifier.focus();
}

export async function _keyboardDidShow() {
  alert("Keyboard did show");
  throw new Error('Keyboard did show');
}