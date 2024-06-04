function! fall#command#FallConfig#call(args) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'config:edit', [a:args]) },
        \)
endfunction

function! fall#command#FallConfig#complete(arglead, cmdline, cursorpos) abort
  let l:pattern = printf('\M^%s', escape(a:arglead, '^$~.*[]\'))
  let l:sources = ['extension', 'picker', 'style']
  return filter(l:sources, { _, v -> v =~? l:pattern })
endfunction
