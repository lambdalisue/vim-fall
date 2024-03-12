let pickerConfigPath: string;
let extensionConfigPath: string;

export interface AssignParams {
  pickerConfigPath: string;
  extensionConfigPath: string;
}

export function assign(params: AssignParams): void {
  pickerConfigPath = params.pickerConfigPath;
  extensionConfigPath = params.extensionConfigPath;
}

export function getPickerConfigPath(): string {
  return pickerConfigPath;
}

export function getExtensionConfigPath(): string {
  return extensionConfigPath;
}
