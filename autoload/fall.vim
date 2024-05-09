function! fall#start(name, cmdline) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'start', [a:name, a:cmdline]) },
        \)
endfunction

function! fall#action(name) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'dispatch', ['action-invoke', a:name]) },
        \)
endfunction
