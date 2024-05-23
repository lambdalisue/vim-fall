function! fall#command#Fall#call(qargs) abort
  let l:args = split(a:qargs, ' ', v:true)
  const l:name = remove(l:args, 0)
  const l:cmdline = join(l:args, ' ')
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'picker:start', [l:name, l:cmdline]) },
        \)
endfunction

function! fall#command#Fall#complete(arglead, cmdline, cursorpos) abort
  return denops#request('fall', 'extension:complete', [a:arglead, a:cmdline, a:cursorpos])
endfunction
