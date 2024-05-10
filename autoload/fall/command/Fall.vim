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
  let l:pattern = printf('\M^%s', escape(a:arglead, '^$~.*[]\'))
  let l:sources = denops#request('fall', 'extension:list', ['source'])
  return filter(l:sources, { _, v -> v =~? l:pattern })
endfunction
