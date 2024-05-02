function! fall#start(name, cmdline, ...) abort
  let l:source_options = get(a:000, 0, {})
  let l:start_options = get(a:000, 1, {})
  let l:args = [
        \ a:name,
        \ a:cmdline,
        \ l:source_options,
        \ l:start_options,
        \]
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'start', l:args) },
        \)
endfunction

function! fall#action(name) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'dispatch', ['action-invoke', a:name]) },
        \)
endfunction
