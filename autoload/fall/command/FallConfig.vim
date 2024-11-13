let s:sep = has('win32') ? '\' : '/'
let s:fall_config_template = join([
      \ expand('<sfile>:p:h:h:h:h'),
      \ 'denops',
      \ 'fall',
      \ '_assets',
      \ 'default.config.ts',
      \], s:sep)

function! fall#command#FallConfig#call() abort
  let l:path = fnamemodify(expand(g:fall_config_path), ':p')
  if !filereadable(l:path)
    call mkdir(fnamemodify(l:path, ':h'), 'p')
    call writefile(readfile(s:fall_config_template), l:path)
  endif
  execute 'edit' fnameescape(l:path)
  augroup fall_config
    autocmd!
    autocmd BufWritePost <buffer> call s:reload()
  augroup END
endfunction

function! s:reload() abort
  call denops#request('fall', 'picker:reload', [])
endfunction
