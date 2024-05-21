function! fall#command#FallConfig#call(qargs) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', printf('config:edit:%s', a:qargs), []) },
        \)
endfunction

function! fall#command#FallConfig#complete(arglead, cmdline, cursorpos) abort
  let l:pattern = printf('\M^%s', escape(a:arglead, '^$~.*[]\'))
  let l:sources = ['extension', 'picker', 'style']
  return filter(l:sources, { _, v -> v =~? l:pattern })
endfunction
