function! fall#command#FallConfig#call(qargs) abort
  let l:type = a:qargs ==# '' ? 'picker' : a:qargs
  call denops#notify('fall', 'editConfig', [l:type])
endfunction

function! fall#command#FallConfig#complete(arglead, cmdline, cursorpos) abort
  return filter(['picker', 'extension'], { _, v -> v =~# '^' . a:arglead})
endfunction
