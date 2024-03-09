function! fall#command#Fall#call(qargs) abort
  let l:args = split(a:qargs, ' ', v:true)
  const l:name = remove(l:args, 0)
  call fall#start(l:name, l:args, {})
endfunction

function! fall#command#Fall#complete(arglead, cmdline, cursorpos) abort
  return []
endfunction
