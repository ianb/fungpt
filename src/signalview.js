export class SignalView {
  constructor(signal, getter, setter) {
    this.signal = signal;
    this.getter = getter;
    this.setter = setter;
  }
  get value() {
    return this.getter(this.signal);
  }
  set value(value) {
    this.setter(this.signal, value);
  }
}

export class LastItemView {
  constructor(signal, defaultValue = undefined) {
    this.signal = signal;
    this.defaultValue = defaultValue;
  }
  get value() {
    if (!this.signal.value) {
      if (this.defaultValue === undefined) {
        throw new Error("No item (null) for LastItemView");
      }
      return this.defaultValue;
    }
    if (this.signal.value.length === 0) {
      if (this.defaultValue === undefined) {
        throw new Error("No item (empty list) for LastItemView");
      }
      return this.defaultValue;
    }
    return this.signal.value[this.signal.value.length - 1];
  }
  set value(value) {
    if (!this.signal.value.length) {
      throw new Error("No item (empty list) for LastItemView.value setter");
    }
    this.signal.value = [
      ...this.signal.value.slice(0, -1),
      value
    ];
  }
}

export class AttributeView {
  constructor(signal, attribute, defaultValue = undefined) {
    this.signal = signal;
    this.attribute = attribute;
    this.defaultValue = defaultValue;
  }
  get value() {
    if (!this.signal.value) {
      if (this.defaultValue === undefined) {
        throw new Error(`No value (null) for AttributeView .${this.attribute}`);
      }
      return this.defaultValue;
    }
    return this.signal.value[this.attribute];
  }
  set value(value) {
    this.signal.value = {
      ...this.signal.value,
      [this.attribute]: value
    };
  }
}
