function! fall#command#FallConfig#call() abort
  call denops#notify('fall', 'editConfig', [])
endfunction

function! fall#command#FallConfig#complete(arglead, cmdline, cursorpos) abort
  return []
endfunction
