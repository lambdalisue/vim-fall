function! fall#command#Fall#call(qargs) abort
  let l:args = split(a:qargs, ' ', v:true)
  const l:name = remove(l:args, 0)
  const l:cmdline = join(l:args, ' ')
  call fall#start(l:name, l:cmdline)
endfunction

function! fall#command#Fall#complete(arglead, cmdline, cursorpos) abort
  return []
endfunction
